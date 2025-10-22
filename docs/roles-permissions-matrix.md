# Roles & Permissions Matrix

This document captures the current and planned access model that informed the multi-role upgrade.

## Inventory of Legacy Role Usage

- Legacy `profiles.role` column (created in `supabase/migrations/20250917125129_94c2f723-5105-4162-80b2-185dd8119139.sql`) has been retired in favour of the new join table.
- All RLS helpers/policies that previously compared `profiles.role` now call `public.has_role`/`public.has_any_role`; see `supabase/migrations/20260401120000_multi_role_permissions.sql` for the updates.
- Server utilities (`src/server/auth/requireAdmin.ts`) and API routes consume the new RPC helpers and operate on role arrays instead of a single `role` field.
- Client hooks such as `useUserProfile` expose `roles: string[]`, `permissions: string[]`, and helper predicates instead of a flat role string.
- Supabase types (`src/integrations/supabase/types.ts`) include the new tables (`roles`, `profile_roles`, `permissions`, `role_permissions`) and reflect the dropped `profiles.role` column.

## Canonical Permissions

| Permission            | Description                     | Default Roles |
| --------------------- | ------------------------------- | ------------- |
| `cms.read`            | View CMS content & drafts       | admin, editor |
| `cms.write`           | Create/update/delete CMS pages  | admin, editor |
| `cms.media`           | Upload/delete CMS media         | admin, editor |
| `nav.manage`          | Manage navigation links         | admin, editor |
| `admin.access`        | Access admin console            | admin         |
| `security.audit.read` | View security events/logs       | admin         |
| `newsletter.manage`   | Manage newsletter subscriptions | admin         |

## Role <> Permission Mapping

- **admin**: inherits every permission (implicit superuser flag).
- **editor**: `cms.read`, `cms.write`, `cms.media`, `nav.manage`.
- **user**: no elevated permissions beyond authenticated defaults.
- **management / doctor / employee / coordinator**: no permissions yet; they will be assigned later through the forthcoming UI.

## Implementation Notes

- Normalized tables (`roles`, `permissions`, `role_permissions`, `profile_roles`) back permissions and allow future expansion without schema churn.
- Helper functions (`public.user_roles`, `public.has_role`, `public.has_any_role`, `public.user_permissions`, `public.has_permission`) centralise RLS logic and are surfaced through RPC helpers for the application.
- The legacy single-role column has been removed; for historic references, rely on the audit log or re-derive a primary role via `profile_roles` ordering.
- Supabase client types are checked into the repo; regenerate with `supabase gen types typescript --project-ref <ref> --schema public > src/integrations/supabase/types.ts` whenever the schema changes.
- The Admin Access console (`/admin/access`) provides a UI for assigning one or more roles to a profile, ensuring the default `user` role is always retained.
