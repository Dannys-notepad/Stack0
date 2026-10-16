---
title: "Debugging idempotency in Express + Firestore"
description: "An idempotency middleware for Express on Firestore looked correct on paper, then two racing requests produced a 500 on the winner, a 409 on the loser, and, worst of all, two users with the same email. Here's the full debugging trail, with the code at each step."
date: 2026-10-03
category: "NODE"
tags: ["node", "express", "firebase", "idempotency", "debugging"]
draft: false
---

The middleware looked right. A transaction reads an idempotency key, checks its status, claims it if free, and returns a cached response if it isn't. Standard pattern, all the pieces in place, nothing obviously wrong.

Then I stress-tested it with two concurrent requests sharing the same `Idempotency-Key`, and the results were wrong in three different ways, each one hiding behind the last.

## The starting point

Here's the middleware as I first wrote it. This is the code that looked fine.

```javascript
// middleware/idempotency.js
import { db } from "#database/firebase.js";
import AppError from "#lib/AppError.lib.js";

const COLLECTION = 'idempotency_keys'
const TTL_MS = 24 * 60 * 60 * 1000

async function idempotency (req, res, next) {
    const key = req.header('Idempotency-Key')
    if (!key) return next()

    const docRef = db.collection(COLLECTION).doc(key)
    const now = Date.now()

    try {
        const result = await db.runTransaction(async (t) => {
            const snap = await t.get(docRef)

            if (snap.exists) {
                const data = snap.data()

                if (data.expiresAt && data.expiresAt < now) {
                    t.set(docRef, {
                        status: 'processing',
                        createdAt: now,
                        expiresAt: now + TTL_MS,
                    })
                    return { cached: false }
                }

                if (data.status === 'complete') {
                    return { cached: true, response: data.response }
                }

                if (data.status === 'processing') {
                    return { conflict: true }
                }
            }

            t.set(docRef, {
                status: 'processing',
                createdAt: now,
                expiresAt: now + TTL_MS,
            })
            return { cached: false }
        })

        if (result.conflict) {
            throw AppError.conflict('Request already in progress')
        }

        if (result.cached) {
            return res
                .status(result.response.status)
                .set('Idempotent-Replay', 'true')
                .json(result.response.body)
        }

        res.completeIdempotent = async (status, body) => {
            await docRef.set(
                { status: 'complete', response: { status, body }, completedAt: Date.now() },
                { merge: true }
            )
        }

        res.on('close', async () => {
            if (!res.writableEnded) {
                try {
                    await docRef.delete()
                } catch (e) {
                    throw AppError.server()
                }
            }
        })

        next()
    } catch (error) {
        next(error)
    }
}

export default idempotency
```

And the registration path it was meant to protect:

```javascript
// services/auth.service.js
export const registerUser = async (name, email, password) => {
    try {
        const existingUser = await userRepository.findByEmail(email)
        if (existingUser) {
            if (existingUser.authProvider === AuthProvider.GOOGLE && !existingUser.hashedPassword) {
                throw AppError.conflict('An account with this email exists via Google Sign-In.')
            }
            throw AppError.conflict('An account with this email address already exists.')
        }

        const hashedPassword = await hashPassword(password)
        const verificationCode = generateOtp()
        const expiresAt = addTimeFromNow(24, 'hours')

        const newUser = await userRepository.create({
            name,
            email,
            hashedPassword,
            authProvider: AuthProvider.EMAIL,
            emailIsVerified: false,
            emailVerificationToken: verificationCode,
            emailVerificationExpiresAt: expiresAt,
            onBoardingCompleted: false
        })

        if (!newUser) throw AppError.server('Could not create user account')

        enqueueEmail({ /* ... */ })

        return response('Registration successful...', { userId: newUser.id })
    } catch (error) {
        if (error instanceof AppError) throw error
        throw AppError.server('Something went wrong during registration', unwrapErrorDetails(error))
    }
}
```

And the route:

```javascript
router.post('/auth/register', idempotency, handleRegister)
```

For stress testing, I fired two requests concurrently with the same key:

```javascript
const key = crypto.randomUUID()
const body = JSON.stringify({ name: 'Test', email: 'a@b.com', password: 'pw' })
const headers = { 'Content-Type': 'application/json', 'Idempotency-Key': key }

const [r1, r2] = await Promise.all([
    fetch('http://localhost:3000/auth/register', { method: 'POST', headers, body }),
    fetch('http://localhost:3000/auth/register', { method: 'POST', headers, body })
])

console.log(r1.status, await r1.text())
console.log(r2.status, await r2.text())
```

That's the whole test. Same key, same body, fired at the same instant. Run it a hundred times, log the status codes, watch what happens.

## The first symptom: the winner 500s

The first few runs looked roughly correct. One 201, one 409. Then a run produced a 201 followed by a 500, and the server logged an error after the 201 had already been sent.

The client saw a valid registration. The server saw a crash. The response body was correct, but something ran after it.

Adding a log line to `completeIdempotent` and a log line to the `'close'` handler made the sequence obvious:

```javascript
res.completeIdempotent = async (status, body) => {
    console.log('completeIdempotent called', status)
    await docRef.set({ status: 'complete', response: { status, body }, completedAt: Date.now() }, { merge: true })
    console.log('completeIdempotent done')
}

res.on('close', async () => {
    console.log('close fired, writableEnded =', res.writableEnded)
    if (!res.writableEnded) {
        console.log('running cleanup')
        // ...
    }
})
```

Output on a failing run:

```
completeIdempotent called 201
close fired, writableEnded = false
running cleanup
completeIdempotent done
```

The cleanup was running after the response body was already written but before `writableEnded` had flipped to `true`. It deleted the idempotency key. Then `completeIdempotent` finished its write — but the document had just been deleted underneath it, or the write-after-delete conflicted.

The catch in the cleanup block did this:

```javascript
catch (e) {
    throw AppError.server()
}
```

That throw was inside an async callback nobody awaited. It never reached `next(err)`. It became an unhandled promise rejection — logged as a 500 by Express's default handler, or in some Node versions, silently swallowed.

**Root cause:** `res.on('close')` fires on every response, not just aborted ones. The `!res.writableEnded` guard is racy under load. And the throw inside an async callback can't be caught by Express.

### Fix: delete the cleanup handler entirely

It was never necessary. The key has a TTL. If a request crashes mid-flight, the claim expires, and a retry treats the key as new. The cleanup handler was an optimization that introduced more bugs than it solved.

```javascript
// Remove entirely:
// res.on('close', async () => { ... })
```

I also split the TTLs — 30 seconds for `processing`, 24 hours for `complete` — so a stale lock from a crashed request unblocks quickly without keeping the completed response cached for only 30 seconds.

## The second symptom: both requests succeed

With the 500 partially understood, the next run of the stress test surfaced something worse. Both requests returned 201. No 409 at all.

That meant the middleware wasn't preventing the second request from executing. Both transactions ran, both saw "key doesn't exist," both claimed it, both proceeded.

I instrumented the transaction:

```javascript
const result = await db.runTransaction(async (t) => {
    const snap = await t.get(docRef)
    console.log('snapshot exists?', snap.exists, 'status:', snap.data()?.status)
    // ...
})
```

Both requests logged `snapshot exists? false`. Both took the "first time" branch. Both committed.

**Root cause:** `status: 'processing'` was a flag, not a lock. Firestore transactions are optimistic — they detect write-write conflicts at commit and retry the loser. But if both transactions read `exists === false` before either commits, and the SDK's read batching hides the first commit from the second read, both can commit. The retry usually catches it, but not always. Under sustained concurrency, the window is wider than it looks.

This is the part that made me stop trusting the middleware as the source of truth. If it can fail under load, it can't be the thing that prevents duplicates. It can only be a convenience on top of a real constraint.

I didn't fix this in the middleware, because the middleware is only for same-key retries and the fix belongs in the data model anyway. I'll come back to this.

## The third symptom: duplicate users

This was the one that actually mattered, and it appeared even with completely different keys.

Two API clients, same email, different `Idempotency-Key` headers, both sent at the same time. Result: two users with the same email in Firestore.

The middleware was never supposed to catch this — different keys are different operations. But the registration path should have.

It didn't, because the registration path was a TOCTOU race:

```javascript
const existingUser = await userRepository.findByEmail(email)   // read
if (existingUser) throw AppError.conflict('Email already exists')

// ---- window here ----

const newUser = await userRepository.create({ email, ... })    // write
```

Two requests, both read "no user with this email," both write. The create used `collection.doc()` with no ID, so Firestore generated two different document IDs. Firestore has no unique-field constraint, so nothing stopped the second write.

I confirmed this by adding a log line before and after the `findByEmail`:

```javascript
const existingUser = await userRepository.findByEmail(email)
console.log('existing user?', !!existingUser)
if (existingUser) throw AppError.conflict('...')

console.log('about to create')
const newUser = await userRepository.create({ email, ... })
```

Output on a failing run:

```
request A: existing user? false
request B: existing user? false
request A: about to create
request B: about to create
request A: created
request B: created
```

Both requests read before either wrote. Both wrote. Two users.

**Root cause:** the uniqueness check and the write were separate operations, with no atomicity between them. This is the classic TOCTOU bug, and it's independent of the middleware entirely. It would have happened with or without idempotency.

Duplicate requests need idempotency. Duplicate data needs a uniqueness constraint. I had conflated the two.

## The fix, layer by layer

Each symptom needed a different fix, and none alone was sufficient.

### Layer 1: remove the `res.on('close')` handler

Covered above. The 500s disappeared.

### Layer 2: wrap `res.json` instead of asking handlers to remember

The old middleware required every route to call `res.completeIdempotent(...)` before responding. Easy to forget, and forgetting left the key stuck in `processing`. The new version wraps `res.json`:

```javascript
const originalJson = res.json.bind(res)
res.json = async (body) => {
    try {
        await docRef.set({
            status: 'complete',
            response: { status: res.statusCode, body },
            completedAt: Date.now(),
            expiresAt: Date.now() + COMPLETE_TTL_MS
        }, { merge: true })
    } catch (err) {
        console.error('Failed to persist idempotency result:', err)
    }
    return originalJson(body)
}
```

Every successful response is recorded automatically. No handler can forget. The controller becomes:

```javascript
export const handleRegister = async (req, res) => {
    const { name, email, password } = req.body
    const result = await authService.registerUser(name, email, password)
    return AppResponse.success(res, result.details, result.message, result.code ?? 201)
}
```

No `res.completeIdempotent` call needed.

### Layer 3: make the database the final arbiter

This is the layer that actually fixed the duplicate-user bug.

The fix was to derive the user document ID from the email itself, so two concurrent registrations compute the same ID and collide on the same document.

```javascript
// database/repositories/user.repository.js
import crypto from 'node:crypto'

class UserRepository extends BaseRepository {
    emailToId (email) {
        return crypto
            .createHash('sha256')
            .update(email.toLowerCase().trim())
            .digest('hex')
    }
    // ...
}
```

Then in the repository, add a strict-create method that uses Firestore's `doc.create()` (not `set()`):

```javascript
// database/repositories/base.repository.js
async createStrict (parentIds, id, data) {
    try {
        const ref = this._collection(parentIds).doc(id)
        await ref.create(data)
        return await this._getById(parentIds, id)
    } catch (error) {
        handleFirestoreError(error)
    }
}
```

`doc.create()` refuses to write to an existing document, throwing `ALREADY_EXISTS` (gRPC code 6). My existing error handler already mapped that:

```javascript
// database/repositories/firestore.errors.js
const handleFirestoreError = (err) => {
    if (err instanceof AppError) throw err
    const code = err?.code
    if (code === 5 || code === 'not-found' || code === 'NOT_FOUND') throw AppError.notFound('Document not found')
    if (code === 6 || code === 'already-exists' || code === 'ALREADY_EXISTS') throw AppError.conflict('Document already exists')
    // ...
}
```

So the loser of the race got a clean 409 without any new error-handling code. And `registerUser` became:

```javascript
export const registerUser = async (name, email, password) => {
    try {
        const normalizedEmail = email.toLowerCase().trim()

        const existingUser = await userRepository.findByEmail(normalizedEmail)
        if (existingUser) {
            if (existingUser.authProvider === AuthProvider.GOOGLE && !existingUser.hashedPassword) {
                throw AppError.conflict('An account with this email exists via Google Sign-In.')
            }
            throw AppError.conflict('An account with this email address already exists.')
        }

        const hashedPassword = await hashPassword(password)
        const verificationCode = generateOtp()
        const expiresAt = addTimeFromNow(24, 'hours')

        const userId = userRepository.emailToId(normalizedEmail)

        const newUser = await userRepository.createStrict(userId, {
            name,
            email: normalizedEmail,
            hashedPassword,
            authProvider: AuthProvider.EMAIL,
            emailIsVerified: false,
            emailVerificationToken: verificationCode,
            emailVerificationExpiresAt: expiresAt,
            onBoardingCompleted: false
        })

        if (!newUser) throw AppError.server('Could not create user account')

        enqueueEmail({ /* ... */ })

        return response('Registration successful...', { userId: newUser.id })
    } catch (error) {
        if (error instanceof AppError) throw error
        throw AppError.server('Something went wrong during registration', unwrapErrorDetails(error))
    }
}
```

Now even if two requests race past the pre-check, Firestore itself rejects the second write. The constraint lives in the data model, not in application logic.

### Layer 4: normalize the email

The old code stored email as given. `A@b.com` and `a@b.com` were different strings, different hashes, different documents. Duplicate detection missed case variants. Normalizing on write and on lookup closed the gap:

```javascript
// in the converter
email: user.email ? user.email.toLowerCase().trim() : user.email,
```

```javascript
// in findByEmail
const normalized = email.toLowerCase().trim()
const results = await this.findWhere([], 'email', '==', normalized)
```

## Verification

After all four layers, I re-ran the stress test — same key twice, different keys same email, mixed batches, twenty concurrent requests — and the behavior is now what it should be:

- Same key, same body: 201 + 409 (`Idempotent-Replay` header on the winner).
- Same email, different keys: one 201, one 409 ("An account with this email address already exists").
- Twenty concurrent registrations of the same email: exactly one user in Firestore, one 201, nineteen 409s.

The race is gone because the document ID is now the constraint. The middleware still helps with same-key retries, but it's no longer load-bearing for correctness.

## What I actually learned

Four things stuck.

**One: `'close'` fires on success.** I had assumed it meant "aborted." It means "the socket closed, one way or another." Any cleanup logic that fires on it needs an explicit guard, and even then, the guard (`writableEnded`) is racy under load. If you don't need the cleanup, don't write it.

**Two: an optimistic transaction is not a mutex.** Firestore's transactions detect concurrent writes and retry. They do not block. If two transactions both read "not exists" before either commits, both can commit. If you need a real lock, the constraint has to be in the data model — a deterministic ID, a unique field, a reservation document — not in transaction logic.

**Three: never throw from an async callback nobody awaits.** If you want Express to handle an error, it has to reach `next(err)`. Anything else becomes an unhandled rejection. Log it, don't throw it.

**Four: idempotency middleware and uniqueness constraints solve different problems.** Idempotency deduplicates identical requests. It does nothing for two different requests that produce the same data. If you need to prevent duplicate users, duplicate enrollments, duplicate payments, the fix lives in the data model, not the middleware. The middleware is a convenience on top.

The middleware is now correct. But the middleware was never the thing that fixed the bug. The deterministic ID was.