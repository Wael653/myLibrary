# server.js workflow

This document describes the startup and request-handling workflow implemented in `server.js`.

## Overview

`server.js` is the Express application entrypoint. It:

- Loads environment variables from `.env` when not in production
- Configures Express view engine and layout
- Mounts middleware: method override, static files, body parsing
- Connects to MongoDB via Mongoose
- Mounts routers for index, authors, and books routes
- Starts the HTTP server on `process.env.PORT` or `3000`

## Startup sequence

1. If `NODE_ENV` != `production`, loads `.env` using `dotenv`.
2. Imports required modules (`express`, `express-ejs-layouts`, `body-parser`, `method-override`, Mongoose, and route modules).
3. Creates the Express app and sets view engine to EJS.
4. Sets view directory to project `views` folder and layout to `layouts/layout`.
5. Enables `express-ejs-layouts` and `method-override` with `_method` query parameter.
6. Serves static assets from `public/`.
7. Enables URL-encoded body parsing with a 10MB limit (`bodyParser.urlencoded({limit: '10mb', extended: false})`).
8. Connects to MongoDB using `mongoose.connect(process.env.DATABASE_URL)` and logs connection state.
9. Mounts routes: `/` → `routes/index`, `/authors` → `routes/authors`, `/books` → `routes/books`.
10. Starts listening on the configured `PORT` and logs the listening port.

## Middleware responsibilities

- `express-ejs-layouts`: provides a consistent layout wrapper for EJS views.
- `method-override('_method')`: supports HTML form verbs `PUT` and `DELETE` using `?_method=...`.
- `express.static('public')`: serves CSS, client JS, and other static assets.
- `bodyParser.urlencoded(...)`: parses form-submitted data and handles inline base64-encoded images (cover images) up to 10MB.

## Database connection

- `mongoose.connect(process.env.DATABASE_URL)` is used to establish a connection.
- `db.on('error', ...)` logs connection errors.
- `db.once('open', ...)` logs successful connection.

## Route responsibilities

- The `index` router mounts homepage routes and any root-level pages.
- The `authors` router handles creating, listing, editing, showing, and deleting authors.
- The `books` router handles creating, listing, editing, showing, and deleting books, including handling `cover` form field JSON with base64 images.

## How requests flow

1. Client sends HTTP request.
2. Express processes middleware in order: static file handling, method override, body parsing, view layout injection.
3. Request reaches one of the mounted routers based on the URL path.
4. Router handlers interact with Mongoose models in `models/` to query/modify data, then render EJS views or redirect.

## Notes & conventions

- Forms use `?_method=PUT` or `?_method=DELETE` to perform non-POST mutating actions.
- Cover images are submitted as base64-encoded strings in the `cover` form field and parsed by route handlers.
- Errors in mutating routes are rendered back into the form view with an `errorMessage` instead of returning non-200 statuses.

## Files of interest

- `server.js` — application entrypoint and wiring
- `routes/authors.js` — author CRUD handlers
- `routes/books.js` — book CRUD handlers and `saveCover()` logic
- `models/author.js`, `models/book.js` — Mongoose schemas and helper methods
- `views/layouts/layout.ejs` — layout used by all EJS views

