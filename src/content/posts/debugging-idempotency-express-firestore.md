---
title: "Debugging idempotency in Express + Firestore"
description: "An idempotency middleware for Express on Firestore looked correct on paper, then two racing requests produced a 500 on the winner, a 409 on the loser, and, worst of all, two users with the same email. Here's the full debugging trail."
date: 2026-10-03
category: "NODE"
tags: ["node", "express", "firestore", "idempotency", "debugging"]
draft: false
---

The middleware looked right. A transaction reads an idempotency key, checks its status, claims it if free, and returns a cached response if it isn't. Standard pattern, all the pieces in place, nothing obviously wrong.

Then I stress-tested it with two concurrent requests sharing the same `Idempotency-Key`, and the results were wrong in three different ways, each one hiding behind the last.

## The first symptom: the winner 500s

Two requests fired at the same time with the same key. The intended behavior was clear:

- One request wins, executes, returns `201`.
- The other loses, gets a `409`.

What actually happened was less clean. The losing request got its `409` correctly. But the *winning* request (the one that returned `201` to the client) logged a `500` on the server right after.

The response body was correct. The server was still crashing somewhere behind it.

## Chasing the 500: `res.on('close')`

The middleware had a cleanup hook, meant to release a stuck claim if the handler died mid-flight:

```javascript
res.on('close', async () => {
    if (!res.writableEnded) {
        try {
            await docRef.delete()
        } catch (e) {
            throw AppError.server()
        }
    }
})
```

The intent was: if the response never finished, drop the idempotency key so a retry can start fresh.

The assumption buried in that intent was that `res.on('close')` only fires on an aborted response. It doesn't. In Node, `'close'` fires on every response, successful ones included, once the underlying socket closes.

The `!res.writableEnded` check was supposed to filter for the abort case. It doesn't reliably do that. `writableEnded` flips to `true` after `res.end()` finishes flushing, and there's a window between "the route called `res.json()`" and "Node flips the flag" where the response is already on the wire but the flag is still `false`. Under load, keep-alives, and proxies, that window widens.

So on successful responses, the cleanup sometimes ran. It called `docRef.delete()` on a document that had just been written by `completeIdempotent`. The delete raced the write. If the delete landed last, the key was gone. If it landed during the write, Firestore rejected the write-after-delete.

Either way, the cleanup's `catch` did this:

```javascript
catch (e) {
    throw AppError.server()
}
```

That `throw` was inside an async callback that nobody awaited. It never reached `next(err)`. It became an unhandled promise rejection, logged as a 500 by Express's default handler or, in some Node versions, silently swallowed.

The 500 on the winner was the cleanup handler stepping on the success path.

## The second symptom: both requests succeed

With the 500 partially explained, the next stress test surfaced something worse. Most of the time, both racing requests returned `201`, with no `409` at all.

That meant the middleware wasn't actually preventing the second request from executing. Both transactions ran, both saw "key doesn't exist," both claimed it, both proceeded.

The middleware assumed that writing `status: 'processing'` in a Firestore transaction was a lock. It isn't. Firestore transactions are optimistic: they detect write-write conflicts at commit time and retry the losing one. If both transactions read `snap.exists === false` before either commits, and the SDK's read batching happens to hide the first write from the second, both can commit. The retry usually catches it, but "usually" is not "always," and under real concurrency the window is wider than it looks.

`status: 'processing'` was a flag, not a lock. It signaled intent. It did not enforce mutual exclusion.

## The third symptom: duplicate users

This was the one that actually mattered.

Racing two requests with the same `Idempotency-Key` sometimes produced two users with the same email. That shouldn't have been possible even if the middleware failed, unless the user creation path itself didn't care about uniqueness.

It didn't. The registration flow looked like this:

```javascript
const existingUser = await userRepository.findByEmail(email)
if (existingUser) throw AppError.conflict('Email already exists')

const newUser = await userRepository.create({ email, ... })
```

Classic TOCTOU (time-of-check to time-of-use). Two requests, both read "no user with this email," both write. `create()` used `collection.doc()` with no ID, so Firestore happily generated two different document IDs. Firestore has no unique-field constraint, so nothing stopped the second write.

This was the real bug. The idempotency middleware was never going to fix it, because the middleware deduplicates identical keys, not identical data. Two clients sending the same email with different keys, or no key at all, were two distinct operations. The middleware, even working perfectly, would let both through.

**Duplicate requests need idempotency. Duplicate data needs a uniqueness constraint.** I had conflated the two.

## The fix, layer by layer

Each symptom needed a different fix, and none of them alone was sufficient.

### Layer 1: delete the `res.on('close')` handler

It was the source of the 500s and it was never necessary. The idempotency key has a TTL. If a request crashes mid-flight, the claim expires, and a retry treats the key as new. The cleanup handler was an optimization that introduced more bugs than it solved.

I also split the TTLs: 30 seconds for `status: 'processing'` (so stale locks unblock quickly), 24 hours for `status: 'complete'` (so replays stay cheap).

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

Every successful response is recorded automatically. No handler can forget.

### Layer 3: make the database the final arbiter

The middleware fix was necessary but not sufficient. The duplicate users were the deeper bug.

The fix was to derive the user document ID from the email itself:

```javascript
emailToId (email) {
    return crypto
        .createHash('sha256')
        .update(email.toLowerCase().trim())
        .digest('hex')
}
```

Now two concurrent registrations for the same email compute the same ID, and collide on the same document. Firestore's `doc.create()`, as opposed to `set()`, refuses to write to an existing document, throwing `ALREADY_EXISTS` (gRPC code 6). My existing error handler already mapped that code to `AppError.conflict`, so the loser got a clean `409` without any extra code.

```javascript
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

Now, even if two requests race past every check, Firestore itself rejects the second write. The constraint lives in the data model, not in application logic.

### Layer 4: normalize the email

The old code stored email as given. `A@b.com` and `a@b.com` were different strings, different hashes, different documents. Duplicate detection missed case variants. Normalizing on write and on lookup closed the gap.

## What I actually learned

Three things stuck.

**One: `'close'` fires on success.** I had assumed it meant "aborted." It means "the socket closed, one way or another." Any cleanup logic that fires on it needs an explicit guard, and even then, the guard (`writableEnded`) is racy under load. If you don't need the cleanup, don't write it.

**Two: an optimistic transaction is not a mutex.** Firestore's transactions detect concurrent writes and retry. They do not block. If two transactions both read "not exists" before either commits, both can commit, and the retry only usually catches it. If you need a real lock, the constraint has to be in the data model (a deterministic ID, a unique field, a reservation document), not in transaction logic.

**Three: idempotency middleware and uniqueness constraints solve different problems.** Idempotency deduplicates identical requests. It does nothing for two different requests that produce the same data. If you need to prevent duplicate users, duplicate enrollments, duplicate payments, the fix lives in the data model, not the middleware. The middleware is a convenience on top.

The middleware is now correct. But the middleware was never the thing that fixed the bug. The deterministic ID was.
