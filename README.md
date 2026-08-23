# Stack0

Minimal multi-app project with an Express API and static admin/web frontends.

## Project Overview

- **API**: Express-based backend located in `apps/api`.
- **Admin**: Static admin UI in `apps/admin` (HTML/CSS/JS).
- **Web**: Public static site in `apps/web` (HTML/CSS/JS).

## Repo Structure

- apps/
  - admin/    — static admin UI (HTML/CSS/JS)
  - api/      — Express API (source in `apps/api/src`)
  - web/      — public static site

## Requirements

- Node.js (16+ recommended)
- npm (or pnpm/yarn)

## Running the API

1. Install dependencies:

   `cd apps/api && npm install`

2. Configure environment (optional): create `apps/api/.env` with `PORT` or rely on default `5000`.

3. Start in development (auto-restart):

   `npm run dev` (from `apps/api`)

4. Start in production:

   `npm start` (from `apps/api`)

The API server listens on the value of `PORT` (default: `5000`). The main server file is `apps/api/src/server.js`.

## API Routes (quick reference)

- GET `/api/posts` — list posts
- POST `/api/posts` — create a new post (JSON body)

Example requests:

- List posts:

  `curl http://localhost:5000/api/posts`

- Create a post:

  `curl -X POST http://localhost:5000/api/posts -H "Content-Type: application/json" -d '{"title":"Test","body":"Sample"}'`

For full route implementation see `apps/api/src/modules/posts`.

## Serving the Frontends

Both `apps/admin` and `apps/web` are static sites. You can open the HTML files directly in a browser, or serve them with a simple static server, for example:

- Using `serve`:

  `npx serve apps/web -l 8080`

- Using `live-server` for live reload during development:

  `npx live-server apps/admin`

Adjust ports as needed.

## Development Notes

- The API uses ESM modules (`type: module`) and `dotenv` for environment variables.
- Main API scripts are defined in `apps/api/package.json` (`start`, `dev`).

## Contributing

Contributions are welcome. Open an issue or pull request with a brief description of changes.

## License

This project uses the ISC license (see `apps/api/package.json`).
