# SmartAgri Advisor — Frontend (Admin + Survey Officer console)

React (Vite) web console for the two roles from the project roadmap that
this repo covers: **Admin** (crop/product/dosage master data, survey
officer accounts, reports) and **Survey Officer** (review farmer photo
submissions).

## Status vs. the backend

Only `apps/accounts` is fully built on the Django side right now
(register/login/refresh/me). Everything else — crops, products,
stage-product dosage mapping, survey submissions, employees, reports —
has DB models but no serializers/views/urls yet. So:

- **Auth is real** — this app logs in against the actual Django backend.
- **Everything else runs on mock data** shaped to match the real Django
  models exactly (see `src/api/mockData.js`), so there's nothing to
  rewrite when the real endpoints land — just flip a flag.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Runs on `http://localhost:3000` — matches the backend's
`CORS_ALLOWED_ORIGINS` default, so no CORS config changes needed as long
as Django is running on `http://localhost:8000`.

You'll need a real user to log in with. Either:
- Register a `survey_officer` via the app's `/register` screen (hits the
  real backend), or
- Create an `admin` via the backend: `python manage.py createsuperuser`
  (admins can't self-register).

## Swapping mock data for the real API

Everything lives behind one file: **`src/api/config.js`**.

```js
export const MOCK_FLAGS = {
  crops: true,
  cropStages: true,
  products: true,
  stageProducts: true,
  surveySubmissions: true,
  employees: true,
  reports: true,
};
```

When Person 1 ships a real endpoint (say, `GET /api/crops/`), flip
`crops: false`. That's it — `src/api/cropsApi.js` already has the real
`apiClient.get("/crops/")` call written and ready, it's just been
sitting behind the flag. No page or component needs to change, because
pages only ever import from `*Api.js` files, never from `mockData.js`
directly.

Each resource flips independently — you don't have to wait for every
endpoint to be done at once.

**Before flipping a flag**, open the corresponding `*Api.js` function and
confirm the URL path and payload shape match what Person 1 actually
built (the paths used here follow the roadmap doc's contract, e.g.
`/api/admin/crops/`, `/api/admin/stage-products/`, but confirm field
names against the real serializer — FK fields may come back nested
instead of as raw ids).

A small **"mock data" pill** shows next to any page subtitle that's
still running on mock data, so it's obvious at a glance during dev.
Delete the `<MockNotice />` usage for a page once its flag is `false`.

## Project layout

```
src/
  api/
    client.js       axios instance + JWT refresh-on-401 interceptor
    authApi.js       real backend calls (register/login/me) + JWT decode
    config.js         MOCK_FLAGS — the switch described above
    mockData.js         seed data matching the real Django models
    cropsApi.js           crops / stages / products / stage-products
    surveysApi.js           submissions / employees / reports
  context/AuthContext.jsx  current user + role, from the JWT
  routes/ProtectedRoute.jsx  role-gated route guard
  components/               Sidebar, PageHeader, Modal, StatusBadge
  pages/
    auth/       Login, Register
    admin/      Reports, Crops, Products, StageProducts, Employees
    survey/     Submissions list, Submission review detail
```

## Notes

- JWT access tokens expire in 60 min by default; the axios interceptor in
  `api/client.js` refreshes automatically on a 401 and replays the
  original request once. If refresh also fails, it clears tokens and
  bounces to `/login`.
- Role is read directly off the JWT claims (`role`, baked in by
  `SmartAgriTokenObtainPairSerializer`), not a separate `/me/` call.
- Registration only allows `survey_officer` here — admins are created on
  the backend directly, matching `RegisterSerializer`'s restriction.
