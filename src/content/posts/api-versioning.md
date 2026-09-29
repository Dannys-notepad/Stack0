---
title: "You probably don't need to version your API"
description: "Versioning is a promise about how long you'll keep old code around. Most APIs make that promise too early, then break it anyway. There's a less expensive way."
date: 2026-05-25
category: "API"
tags: ["api-design", "backend"]
draft: false
---

Every API design guide says you should version your API from day one. Put `/v1/` in the URL, commit to never breaking it. This is advice from companies with hundreds of internal consumers and a decade of operational history. It is not advice for your side project.

## What versioning actually costs

When you ship `/v1/`, you've made three commitments:

1. Every change after this is additive. You can add fields, you can't change them.
2. Every bug in v1 is now permanent. You can fix it in v2, but v1 stays broken for whoever hasn't migrated.
3. You now maintain two versions. Every shared piece of code has to work with both.

That's a lot of overhead for an API that has three consumers and a codebase you rewrote last month.

## What to do instead

Ship unversioned. Make breaking changes when they're the right thing. Tell your consumers. If you have five users, a changelog and an email is enough.

This works until:
- You have consumers you can't coordinate with directly
- You have a published SDK that people build on
- You have a contract with an enterprise customer

Then you version. Not before.

## How to version when you need to

When you do get to that point, be careful about *how*.

**URL versioning** (`/v1/users`) is the most visible, the most cacheable, the easiest to reason about. But every version is a separate route.

**Header versioning** (`Accept: application/vnd.myapi.v1+json`) is cleaner semantically, but harder to test in a browser and confusing to some consumers.

**Date-based versioning** (Stripe's approach) is `Stripe-Version: 2024-04-10`. The server maps each version to a snapshot of behavior. This is powerful and lets you make granular changes without breaking anyone, but it's a lot of machinery to maintain.

Pick URL versioning unless you have a specific reason not to. It's boring and that's the point.

## The real advice

Design your API so breaking changes are rare:

- Return objects, not arrays. Adding fields is safe; changing the response shape isn't.
- Use enums sparingly. Every enum value you add is a potential breaking change for code that didn't expect it.
- Make optional parameters actually optional. If you require a new field, you've broken every existing client.
- Don't rename things. The cost of a bad name is lower than the cost of migration.

Do that, and you'll go years without needing a version bump. Which is the actual goal — not "we have versioning," but "we never needed it."