# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

"MyLibrary" is a server-rendered CRUD web app for managing **authors** and **books**. It is a classic Express + EJS + MongoDB (Mongoose) stack — no client-side framework, no build step. Pages are rendered on the server with EJS; the only significant client-side JS handles cover-image uploads (FilePond) and the responsive navbar.

## Commands

```bash
npm start          # node server.js (production-style start)
npm run devStart   # nodemon server.js (auto-reload during development)
```

There is **no test runner, linter, or build step**. The only automated check is a syntax check used in CI:

```bash
node --check server.js
for f in routes/*.js models/*.js public/javascripts/*.js; do node --check "$f"; done
```

Run this before considering a change "done" — it is the same gate the pipeline enforces.

## Environment

- `.env` (git-ignored, loaded via `dotenv` only when `NODE_ENV !== 'production'`) provides `DATABASE_URL` (MongoDB connection string). `PORT` defaults to `3000`.
- A running MongoDB instance is required — the app calls `mongoose.connect()` at startup.

## Architecture

Request flow: `server.js` wires middleware and mounts three routers → routers query Mongoose models → routers render EJS views (or redirect). See `docs/server-workflow.md` for the detailed startup/middleware sequence.

- **`server.js`** — entrypoint. Sets EJS + `express-ejs-layouts` (layout = `views/layouts/layout.ejs`), `method-override('_method')`, static serving from `public/`, and `bodyParser.urlencoded({ limit: '10mb' })`. Mounts `/` → `routes/index`, `/authors` → `routes/authors`, `/books` → `routes/books`.
- **`models/`** — `author.js`, `book.js` (Mongoose schemas). A book belongs to an author via an ObjectId `ref: 'Author'`.
- **`routes/`** — CRUD handlers, one file per resource.
- **`views/`** — EJS templates: `authors/` and `books/` each have `index`, `new`, `edit`, `show`, and a shared `_form_fields.ejs` partial. Cross-cutting partials live in `views/partials/` (header, BookGrid, deleteForm, errorMessage).
- **`public/`** — static assets: `stylesheets/` (with a `shared/` folder of per-concern CSS + `variables.css` design tokens), `javascripts/` (`fileUploads.js`, `navbar.js`), and Gotham Rounded fonts.

## Conventions specific to this codebase

- **HTML verb overriding**: forms POST with `?_method=PUT` or `?_method=DELETE` (via `method-override`). Real routes are defined as `router.put` / `router.delete`.
- **Cover images are stored in MongoDB, not on disk.** The client (`fileUploads.js` + FilePond with the file-encode plugin) base64-encodes the image and submits it as a JSON string in the `cover` form field. `saveCover()` in `routes/books.js` parses it, validates the MIME type against `imageMimeTypes`, and stores raw bytes in `book.coverImage` (Buffer) + `book.coverImageType`. Views render it through the `coverImagePath` virtual, which builds a `data:` URI. There is no `public/uploads` directory in use despite the `.gitignore` entry.
- **Error handling in mutating routes**: on failure, re-render the same form view with an `errorMessage` (HTTP 200) rather than returning an error status. Follow this pattern when adding routes.
- **Deleting an author with books is blocked** by a `pre('deleteOne', { document: true })` hook in `models/author.js` that throws if any book references the author. Because it is a *document* middleware hook, authors must be deleted via `author.deleteOne()` on a loaded document (as the route does), not via a query-level delete.
- **CSS is organized by concern** under `public/stylesheets/shared/` and pulled together by `main.css`; design tokens (colors, cover dimensions/aspect ratio) live in `variables.css` and are read at runtime by `fileUploads.js` to size the upload widget.

## Deployment

GitLab CI (`.gitlab-ci.yml`) publishes to **GitLab Pages, which serves only static HTML** — no Node or Mongo run in production. The `pages` job boots the app against a temporary Mongo service container, crawls it with `wget --mirror`, and publishes the resulting static snapshot from `public/`. Keep all navigable pages reachable via links from `/` so the crawler captures them.

## Other directories (not part of the running app)

- `Mybrary-1.6/` — an older/reference copy of the project.
- `nimbalyst-local/mockups/` — design mockups.
- `demo.html` (git-ignored) — standalone demo file.
