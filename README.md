# Stack0 API

A lightweight TypeScript API built with Hono, Firebase Admin, and Nodemailer. It provides post management and newsletter subscription endpoints for a small content platform.

## Tech Stack

- TypeScript
- Hono
- Firebase Admin SDK
- Nodemailer
- Zod

## Prerequisites

- Node.js 18+
- npm
- A Firebase project with service account credentials
- SMTP credentials for sending mail

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root with the following values:

```env
SMTP_USERNAME=your-smtp-username
SMTP_PASSWORD=your-smtp-password
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
```

## Running the Project

### Development

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

## API Overview

### Health Check

- `GET /`

### Posts

- `GET /api/posts`
- `GET /api/posts/:slug`
- `POST /api/posts`
- `PATCH /api/posts/:slug`
- `DELETE /api/posts/:slug`

### Newsletter

- `POST /api/newsletter/:email/subscribe`
- `PATCH /api/newsletter/:email/unsubscribe`

## Project Structure

```text
src/
  app.ts
  server.ts
  config/
  lib/
  modules/
    newsletter/
    post/
```

## Notes

- The project uses Firebase Firestore for data persistence.
- Newsletter emails are sent when a new post is created.
- The app is currently configured for local development on port `3000`.

