# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run devStart` — run with nodemon (auto-restart on change); preferred during development.
- `npm start` — run with plain node (`node server.js`).
- No test, lint, or build scripts are configured. The GitLab CI `test` stage's only check is `node --check` on `server.js`, `routes/*.js`, `models/*.js`, and `public/javascripts/*.js` — a syntax check is the de-facto gate, so keep those files parseable.

Requires a running MongoDB. Connection string comes from `DATABASE_URL` in `.env` (loaded via dotenv only when `NODE_ENV !== 'production'`). Default is `mongodb://localhost/my-library`. Server listens on `PORT` or 3000.

## Deployment

`.gitlab-ci.yml` publishes to GitLab Pages, which serves **static files only**. The `pages` job boots the app against a throwaway `mongo:7` service container, then `wget --mirror`s every linked page into `public/` as flat HTML (it rejects `?_method=` links so mutating routes are skipped). Consequence: only content reachable by GET-crawling an empty DB survives to production, and anything requiring a live server or a POST/PUT/DELETE will not work on the deployed site.

## Architecture

Server-rendered MVC CRUD app for a book/author library. Express 5 + Mongoose + EJS (via `express-ejs-layouts`). No client-side framework and no JSON API — every route renders an EJS view or issues a redirect.

- `server.js` — app entry: wires middleware, connects Mongoose, mounts the three routers (`/`, `/authors`, `/books`).
- `models/` — Mongoose schemas (`Author`, `Book`).
- `routes/` — one Express router per resource. Handlers contain all controller logic; there is no service layer.
- `views/` — EJS templates. `layouts/layout.ejs` is the shared shell; `views/<resource>/` holds `index`/`new`/`edit`/`show`; `views/partials/` holds reusable fragments; `views/<resource>/_form_fields.ejs` is shared between the new and edit forms.
- `public/javascripts/fileUploads.js` — client-side FilePond setup.
- `public/javascripts/navbar.js` — off-canvas responsive nav (hamburger toggle + overlay + Escape/click-outside close). Its `(min-width: 769px)` media query must stay in sync with `--nav-breakpoint` in `public/stylesheets/shared/header.css`.

### Conventions that span files

- **PUT/DELETE via method-override.** HTML forms POST to a URL with `?_method=PUT` or `?_method=DELETE` (see `views/partials/deleteForm.ejs` and the edit forms). `methodOverride('_method')` in `server.js` rewrites these to the real verb. New mutating routes must follow this pattern.
- **Cover images live in MongoDB, not on disk.** The client's FilePond `file-encode` plugin serializes the chosen image to a base64 JSON string and submits it in the `cover` form field. `saveCover()` (in `routes/books.js`) JSON-parses it and stores `coverImage` (Buffer) + `coverImageType` on the Book. The `coverImagePath` virtual on the Book schema renders that buffer back as a `data:` URI for `<img src>`. `bodyParser.urlencoded` is configured with `limit: '10mb'` to allow these inline images. Only MIME types in the `imageMimeTypes` allowlist are accepted.
- **Author deletion is guarded in the model, not the route.** `authorSchema.pre('deleteOne', { document: true })` throws if the author still has books, so deletes must use the document method `author.deleteOne()` (not `Author.deleteOne(query)`) for the hook to fire. The route catches the thrown error and re-renders the author's show page with an `errorMessage`.
- **Error display.** Route handlers pass an `errorMessage` into the render options; `views/partials/errorMessage.ejs` (included in the layout) renders it when present. The catch block of a mutating route typically re-renders the form/show page with the error rather than returning an HTTP error status.
- **Form view helpers.** In `routes/books.js`, `renderNewPage`/`renderEditPage` delegate to `renderFormPage`, which loads the author list (needed by the `<select>` in `_form_fields.ejs`) before rendering. `routes/authors.js` has the analogous `renderShowAuthor`.
- **Search is query-string filtering on the list routes**, and the two routes use different (but equivalent) Mongoose styles. `GET /books` chains conditions onto a query object (`title` via case-insensitive regex, `publishedBefore`/`publishedAfter` via `lte`/`gte`); `GET /authors` builds a plain filter object (`name` via regex) passed to `Author.find()`. Both pass `searchOptions: req.query` back to the view so the search form stays populated. Add filters by extending the query/filter, not by post-filtering results.
