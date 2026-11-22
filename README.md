# Kai Lodge Maldives

The website sends contact enquiries, booking requests, and payment-reference notifications to
`kailodgemv@gmail.com`. That address is also the default admin owner account.

## 1. Create the Supabase project

1. Create a project at [Supabase](https://supabase.com/dashboard).
2. Open **SQL Editor** and run these files in order:
   - `supabase/migrations/20261110000001_schema.sql`
   - `supabase/migrations/20261110000002_security_and_booking.sql`
   - `supabase/migrations/20261110000003_admin_operations.sql`
   - `supabase/migrations/20261119000001_update_room_categories_and_prices.sql`
   - `supabase/seed.sql`
3. In **Project Settings → API**, copy the project URL, publishable/anon key, and server-only secret/service-role key.
4. In **Authentication → URL Configuration**, set the production **Site URL** and add both redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR-LIVE-DOMAIN/auth/callback`

## 2. Connect email delivery

1. Sign in to [Resend](https://resend.com), open **API Keys**, and create a key with **Sending access**.
2. For a live site, add and verify a sending domain in Resend. Use a sender on that domain, such as
   `Kai Lodge Website <bookings@YOUR-DOMAIN>`.
3. `onboarding@resend.dev` is suitable for the first test; use the verified-domain sender in production.

The recipient is already set to `kailodgemv@gmail.com`. The Resend key stays on the server and is never sent to the browser.

## 3. Add environment variables

For local development, copy `.env.example` to `.env.local` and fill in the blank values. In PowerShell:

```powershell
Copy-Item .env.example .env.local
```

For Vercel, add the same variables under **Project → Settings → Environment Variables**:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-PUBLISHABLE-OR-ANON-KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVER-ONLY-SECRET-OR-SERVICE-ROLE-KEY
NEXT_PUBLIC_SITE_URL=https://YOUR-LIVE-DOMAIN
ADMIN_OWNER_EMAILS=kailodgemv@gmail.com

RESEND_API_KEY=YOUR-RESEND-KEY
CONTACT_EMAIL_TO=kailodgemv@gmail.com
EMAIL_FROM=Kai Lodge Website <bookings@YOUR-DOMAIN>
```

Never commit `.env.local`, expose `SUPABASE_SERVICE_ROLE_KEY`, or paste private keys into chat. Redeploy the site after changing
production environment variables.

## 4. Create the owner account

1. Start the site with `pnpm dev`, or open the deployed site.
2. Visit `/admin/login` and select **New team member? Create an account**.
3. Register with `kailodgemv@gmail.com` and choose a strong password.
4. Open the confirmation email and follow the link, then sign in.

After the email is confirmed, the server automatically adds this user to `admin_users` with the `owner` role on first sign-in.
No password is stored in this repository. As an alternative, use **Supabase → Authentication → Users → Add user → Send
invitation**, then accept the invitation as `kailodgemv@gmail.com`.

## 5. Verify the forms

Submit one test from the contact page and one from the booking page. Both should arrive at `kailodgemv@gmail.com`. If a form says
email is not configured, check `RESEND_API_KEY`, `EMAIL_FROM`, and the verified sending domain, then redeploy.

## Local development

```powershell
pnpm install
pnpm dev
```
