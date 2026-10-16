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

`signup` and both `signin` endpoints return `{ user, token, expiresAt }`. The API sets no cookies: every client stores the token itself (the admin and storefront keep it in a cookie written from JavaScript) and sends it on each request as `Authorization: Bearer <token>`. `expiresAt` is a unix timestamp (seconds) for when the token stops working, so the client can expire its copy at the same moment. Web tokens and CMS tokens are scoped: one cannot be used on the other's endpoints.

CMS signin additionally checks that `user.role.name` is `admin` or `superadmin` (role is populated on signin) and returns `403` otherwise. There is no CMS signup endpoint — admin/superadmin accounts are promoted from regular accounts (e.g. by pointing `User.role` at the desired Role document) rather than self-registered, since public self-signup into a privileged role is a common privilege-escalation vector.

`password` must be at least 8 characters.

See [Adding a resource](#adding-a-resource) for how to add new endpoints.

## API Docs

Interactive Swagger UI: `http://localhost:3000/api-docs`
Raw OpenAPI spec (JSON): `http://localhost:3000/api-docs.json`

Each module documents its endpoints in its own `<name>.docs.yaml` (e.g. `src/modules/brand/brand.docs.yaml`); every `src/modules/**/*.docs.yaml` file is picked up automatically. Shared components (pagination params, error responses) live in `src/config/swagger.js`.

## Structure

Code is grouped **by feature**, not by layer: everything about brands lives in `src/modules/brand/`. Code that is not specific to this project lives in `src/core/`.

```
src/
  index.js                  # entry point: checks config, connects DB, starts server
  app.js                    # express app: middleware, swagger UI, routes, error handling
  config/                   # env-driven settings (cors, db, s3, swagger)
  routes/
    index.js                # /, /health, mounts /api/web and /api/cms
    web.routes.js           # mounts web-facing module routers
    cms.routes.js           # mounts CMS module routers behind requireAuth('cms')
  core/                     # project-agnostic -- copy into any Express + Mongoose app
    api-error.js            # ApiError(statusCode, message)
    async-handler.js        # wraps async handlers so errors reach the error middleware
    paginate.js             # page/limit parsing + response meta
    validators.js           # paginationRules(), validateId()
    middlewares/            # validate (express-validator) + 404/error handlers
    mongoose/               # soft-delete + toJSON plugins, assertRefsExist
    crud/                   # createCrudService / createCrudController / createCrudRouter
  modules/
    <name>/
      <name>.model.js       # Mongoose schema
      <name>.service.js     # business logic (usually a createCrudService config)
      <name>.routes.js      # validation rules + router (usually createCrudRouter)
      <name>.docs.yaml      # OpenAPI docs for the endpoints
    auth/                   # users, roles, JWT, requireAuth middleware
    media/                  # S3 uploads, signed URLs, streaming
    page/                   # CMS pages + widgets/ (one file per widget type)
    brand/ category/ color/ product/ promo-code/ size/ social/ style/
    newsletter/ payment/ review/   # models only, no routes yet
```

Dependencies only point one way: `modules/` may use `core/` and `config/`, but `core/` never imports from `modules/`.

## Adding a resource

Most resources are standard CRUD with soft delete. Creating `src/modules/tag/` takes three small files:

```js
// tag.model.js
const mongoose = require('mongoose');
const toJsonPlugin = require('../../core/mongoose/to-json.plugin');
const softDeletePlugin = require('../../core/mongoose/soft-delete.plugin');

const tagSchema = new mongoose.Schema(
  { name: { type: String, required: true, unique: true, trim: true } },
  { timestamps: true }
);
tagSchema.plugin(softDeletePlugin);
tagSchema.plugin(toJsonPlugin);

module.exports = mongoose.model('Tag', tagSchema);
```

```js
// tag.service.js
const createCrudService = require('../../core/crud/crud.service');
const Tag = require('./tag.model');

module.exports = createCrudService(Tag, { fields: ['name'] });
```

```js
// tag.routes.js
const { body } = require('express-validator');
const createCrudRouter = require('../../core/crud/crud.router');
const tagService = require('./tag.service');

module.exports = createCrudRouter({
  service: tagService,
  key: 'tag', // responses look like { tag: {...} }
  rules: {
    create: [body('name').trim().notEmpty().withMessage('Name is required')],
    update: [body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')],
  },
});
```

Then mount it in `src/routes/cms.routes.js` (`router.use('/tag', requireCmsAuth, tagRoutes)`) and add a `tag.docs.yaml`, copying one from another module.

That gives you `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `PATCH /:id/delete` (soft delete), `PATCH /:id/restore` and `DELETE /:id` (hard delete). `createCrudService` also takes:

| Option      | Purpose                                               | Example                 |
| ----------- | ----------------------------------------------------- | ----------------------- |
| `fields`    | Whitelist of writable fields (required)               | `['name', 'image']`     |
| `label`     | Name in "… not found" errors (defaults to model name) | `'Promo code'`          |
| `populate`  | Populate spec used on every read/write                | `['image']`             |
| `refs`      | Ids that must exist before saving (422 otherwise)     | `{ image: Media }`      |
| `filters`   | Query params passed through as list filters           | `['brand', 'category']` |
| `serialize` | Custom output, e.g. to sign media URLs                | see `brand.service.js`  |

For non-CRUD endpoints, write a normal controller wrapped in `asyncHandler` (see `modules/page/page.controller.js`), or add routes to the router `createCrudRouter` returns.

## Reusing in another project

Copy `src/core/` as-is. It depends only on `express`, `express-validator` and `mongoose`. Modules such as `auth/` and `media/` are also self-contained: they need `core/` plus the matching `config/` file (`s3.js` for media).
