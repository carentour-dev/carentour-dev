# Upgrade Stabilization Plan

This repo is already on the current core baseline:

- Next.js 16
- React 19
- TypeScript 6

The next step is not another broad dependency upgrade. The next step is to make the current baseline safe to operate and safe to upgrade again.

## Goal

Preserve current functionality while reducing upgrade and release risk.

## Release Policy

Use two verification tiers:

- `npm run verify:baseline`
  Runs the required non-breaking checks on every branch and pull request.
- `npm run verify:release`
  Runs the baseline checks plus a webpack production build before release.

`verify:release` is intentionally stricter than CI because production build behavior currently depends on runtime environment and upstream data availability.

## Recommended Order

1. Stabilize the current baseline.
   - Keep Next 16, React 19, and TypeScript 6 as-is.
   - Avoid broad "upgrade everything" changes until the safety net is stronger.

2. Harden verification around runtime behavior.
   - Add smoke coverage for the highest-risk flows:
     - public homepage and locale switching
     - auth sign-in and redirect behavior
     - CMS preview and publish
     - patient dashboard load
     - one finance happy path
   - Prefer browser-level smoke tests over more source-shape tests.
   - Current first slice is available via `npm run smoke`.
   - Use `SMOKE_BASE_URL=http://localhost:3000 npm run smoke` when targeting an already-running local server.

3. Remove build-time fragility.
   - Audit pages and metadata routes that fetch remote data during build.
   - Keep release builds alive when CMS or database dependencies are unavailable.
   - Reduce remote build dependencies where fallback output is acceptable.

4. Tighten type safety by layer.
   - Start with `src/server/**` and shared business logic.
   - Enable stricter TypeScript settings incrementally in scoped configs before changing the root config.
   - Prioritize nullability and `any` removal in auth, SEO, finance, and CMS server code.

5. Reduce upgrade blast radius.
   - Break up the largest files in CMS editor, dashboard, and admin treatment management.
   - Keep pure logic separated from UI and data access.

6. Upgrade secondary dependencies in batches.
   - Group by domain instead of doing one repo-wide package sweep.
   - Run `verify:baseline` after each batch.
   - Run `verify:release` before merging release branches.

## Current Risks To Address First

- TypeScript is still non-strict in the root config.
- Many tests validate source structure, not runtime behavior.
- Production build behavior still depends on external CMS or database availability in some routes.
- The app has a large client-heavy surface area and several oversized files.

## What Not To Do Next

- Do not enable broad strict TypeScript globally in one change.
- Do not enable React Compiler globally until existing lint waivers are reduced.
- Do not do a repo-wide dependency refresh before adding runtime smoke coverage.
