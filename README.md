# express-aug-2026

Basic Express.js boilerplate with signup/signin auth.

## Setup

Requires a running MongoDB instance.

```bash
npm install
cp .env.example .env
```

Update `.env` with your `MONGODB_URI` and a strong `JWT_SECRET`.

## Run

```bash
npm start   # production
npm run dev # auto-restart on file changes
```

Server runs on `http://localhost:3000` by default.

## Lint & Format

```bash
npm run lint          # eslint check
npm run lint:fix      # eslint check, auto-fix
npm run format        # prettier write
npm run format:check  # prettier check only
```

ESLint (flat config, `eslint.config.js`) handles code-quality rules; Prettier (`.prettierrc.json`) handles formatting. `eslint-config-prettier` disables any ESLint rules that would conflict with Prettier.

A pre-commit hook (Husky + lint-staged) runs `prettier --write` on staged `.js`/`.json`/`.md` files automatically, so commits are always formatted. It's installed automatically by `npm install` (via the `prepare` script) — no manual setup needed.

## API

Routes are namespaced by consumer: `/api/web/*` for the public-facing site/app, `/api/cms/*` for the admin/CMS side. Both share the same `User` model. `role` is its own `Role` collection (`user` | `admin` | `superadmin`, plus a `permissions: string[]` field), referenced from `User.role` — new accounts are assigned the `user` role on signup. All three roles are seeded automatically on server startup (`src/utils/seed-roles.js`, idempotent — only sets fields on first insert via `$setOnInsert`, so `permissions` you assign later per role is never reset on restart). `permissions` defaults to `[]`; the boilerplate doesn't enforce any permission checks yet — assign values that fit your authorization scheme and check them where needed.

| Method | Endpoint               | Body                                          |
| ------ | ---------------------- | --------------------------------------------- |
| GET    | `/`                    | -                                             |
| GET    | `/health`              | -                                             |
| POST   | `/api/web/auth/signup` | `{ name, email, password }`                   |
| POST   | `/api/web/auth/signin` | `{ email, password }`                         |
| GET    | `/api/cms/health`      | -                                             |
| POST   | `/api/cms/auth/signin` | `{ email, password }` (admin-role users only) |

`signup` always returns `{ user, token }`. Both `signin` endpoints behave the same way based on the `X-Client-Type` request header:

- `X-Client-Type: web` — sets the token as an httpOnly cookie and returns `{ user }` only. Web uses cookie name `web_token`, CMS uses `cms_token` (kept separate so both can coexist in the same browser without colliding).
- anything else / omitted — returns `{ user, token }` in the body (for mobile/non-browser clients).

CMS signin additionally checks that `user.role.name` is `admin` or `superadmin` (role is populated on signin) and returns `403` otherwise. There is no CMS signup endpoint — admin/superadmin accounts are promoted from regular accounts (e.g. by pointing `User.role` at the desired Role document) rather than self-registered, since public self-signup into a privileged role is a common privilege-escalation vector.

`password` must be at least 8 characters.

To add CMS-only routes, create a file under `src/routes/cms/` (e.g. `content.routes.js`) and mount it in `src/routes/cms/index.js`. Same pattern for web-only routes under `src/routes/web/`.

## API Docs

Interactive Swagger UI: `http://localhost:3000/api-docs`
Raw OpenAPI spec (JSON): `http://localhost:3000/api-docs.json`

New routes get documented by adding `@swagger` JSDoc comments above the route definition (see `src/routes/web/auth.routes.js`).

## Structure

```
src/
  index.js              # entry point, connects DB, starts server
  app.js                # express app, middleware, swagger UI, error handling
  config/
    db.js                # mongoose connection
    swagger.js            # swagger-jsdoc spec generation
  models/
    user.model.js         # User schema (password hashing, comparePassword, role ref)
    role.model.js          # Role schema (user/admin)
    plugins/
      to-json.plugin.js     # reusable unix-timestamp + field-hiding toJSON plugin
  services/
    auth.service.js       # signup/signin/cmsSignin business logic
  controllers/
    web/
      auth.controller.js    # web signup/signin request handling
    cms/
      auth.controller.js    # cms signin request handling (admin-only)
  routes/
    index.js              # mounts /api/web and /api/cms, top-level routes
    web/
      index.js              # web route aggregator
      auth.routes.js         # web auth routes + validation rules
    cms/
      index.js              # cms route aggregator
      auth.routes.js         # cms auth routes + validation rules
  middlewares/
    validate.middleware.js # express-validator error handler
    error.middleware.js    # 404 + centralized error handler
  utils/
    jwt.js                 # sign/verify JWT helpers
    api-error.js           # ApiError class for typed HTTP errors
    auth-cookie.js          # web/mobile client detection + scoped auth cookie helper
    seed-roles.js           # idempotent upsert of the user/admin Role documents
```
