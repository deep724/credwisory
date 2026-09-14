# Credwisory Next.js migration

This is an App Router, TypeScript migration of the supplied static Credwisory site. The original HTML is retained under `legacy/` and rendered by the typed route adapter in `app/[[...slug]]/page.tsx`. This intentional compatibility layer keeps the original semantic markup, local compiled Tailwind styles, scripts, and URLs unchanged while the reusable runtime component executes legacy browser behavior after hydration.

## Run locally

1. Copy `.env.example` to `.env`, set `MONGODB_URI`, generate `ADMIN_JWT_SECRET` with `openssl rand -base64 48`, and set a separate random `CRON_SECRET`.
2. Run `npm install` and `npm run db:seed`.
3. Run `npm run dev`.

Use `npm run lint`, `npm run typecheck`, and `npm run build` before deployment.

## Backend

`POST /api/leads` accepts validated eligibility, lender enquiry, contact, and referral submissions. It applies a small in-memory IP rate limit and honeypot field before storing a `Lead` in MongoDB. `GET /api/lenders` reads published lenders. `GET /api/health` is a protected heartbeat: send `Authorization: Bearer $CRON_SECRET`; it runs a MongoDB `ping` and returns only a safe availability result. For multi-instance production deployments, replace the in-memory limiter with a shared Redis/KV limiter.

## Admin panel

`/admin/login` provides an HTTP-only, SameSite JWT-cookie sign-in flow with an eight-hour expiry and lockout protection. The dashboard, lead detail workflow, lender management, application list, user list, and audit trail require an active admin account. Permanent lender deletion is restricted to the `SUPER_ADMIN` role and requires an explicit confirmation value. `npm run db:seed` creates the Super Admin role, the configured seed admin, and lender records without overwriting existing records. Never use the example seed password in production.

MongoDB collections include roles, admins, anonymous consented visitor sessions, page views, lead history and notes, lender data, blog metadata, and audit logs. The visitor/session fields are intentionally anonymous until a visitor voluntarily supplies contact information via a form.

### Student profiles

New leads are linked to a `studentprofiles` record only by normalized email and/or the final ten phone digits—never by name alone. Run `npm run db:backfill-students` once after deployment to non-destructively link existing active leads. The script creates profiles and assigns `studentProfileId` values without deleting or overwriting leads; it records each link in the audit log. Profiles with conflicting identifier matches are marked for manual Super Admin review rather than automatically merged.

### Daily database heartbeat

`vercel.json` schedules `/api/health` every day at 03:00 UTC. In Vercel, add `MONGODB_URI`, `ADMIN_JWT_SECRET`, and `CRON_SECRET` to the Production environment, then deploy; Vercel Cron will send the configured request to the protected endpoint. If your scheduler does not support the authorization header, configure an equivalent scheduled job that does. A heartbeat cannot override a database provider's enforced free-tier auto-pause policy; it only keeps an application connection active where the provider supports that behavior.

## Production security and HTTPS

The application sends a restrictive Content Security Policy, HSTS (in production), anti-framing, MIME-sniffing, referrer, and permissions-policy headers. Authentication uses an HTTP-only, SameSite cookie and requires `ADMIN_JWT_SECRET` in production. Login and public APIs have throttling, form submissions use Zod validation plus a honeypot, and rich blog HTML is sanitized on the server.

Deploy behind a platform/load balancer that terminates TLS with a valid certificate, configure the canonical domain as `https://your-domain.example`, and redirect HTTP traffic to HTTPS at that edge. Do not set `ADMIN_COOKIE_SECURE=false` in production. A browser showing **Not secure** on `localhost` is expected when local HTTPS has not been configured; it is not solved by application code or a self-signed certificate alone. Ensure all third-party resources and form/API endpoints use HTTPS to avoid mixed content.

Visitor analytics are opt-in. The consent banner links to `/privacy`; only after acceptance does `/api/analytics` persist an anonymous ID, pages, and timing. Leads link to that anonymous session only where the visitor has consented. Run `npm run db:seed` against the configured MongoDB database before enabling the app for users.

## Migration report

| Original source | Next route |
| --- | --- |
| `index.html` | `/` and `/index.html` |
| Every remaining `*.html` file | The same `/<filename>.html` URL and a matching extensionless route |
| `site-header.js`, `site-motion.js` | `public/`, executed by `components/legacy-runtime.tsx` |
| lender CSS/JS files | `public/`, loaded by their preserved pages |

### Page inventory

`eligibility`, `lender-enquiry`, `compare-all-lenders`, `bank-lenders`, `nbfc-lenders`, `international-lenders`, `scholarships`, `scholarship-eligibility`, `sop-guidance`, `application-guidance`, `blogs`, `contact`, `faq`, `how-education-loans-work`, `loan-with-collateral`, `loan-without-collateral`, `refer-a-friend`, and `talk-to-an-expert` are each available at both `/<name>.html` and `/<name>`.

The supplied `logo-new.png` is served from `public/`. The homepage now compiles the supplied Tailwind classes locally rather than relying on the external Tailwind CDN. The original source had frontend-only form handling; the application adds server-side lead persistence, subject to MongoDB configuration.
