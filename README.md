# Kai Lodge Maldives

The website sends contact enquiries, booking requests, and payment-reference notifications to
`kailodgemv@gmail.com`. That address is also the default admin owner account.

## 1. Connect Supabase

For a Supabase project created in v0, open its resource from the Vercel team’s **Storage** tab and select **Open in Supabase**. Use the existing project for the steps below. [Supabase Marketplace guide](https://supabase.com/docs/guides/integrations/vercel-marketplace)


1. For a new installation, create a project at [Supabase](https://supabase.com/dashboard).
2. Apply only the pending migrations. On a new project, open **SQL Editor** and run the following files in order:
   - `supabase/migrations/20261110000001_schema.sql`
   - `supabase/migrations/20261110000002_security_and_booking.sql`
   - `supabase/migrations/20261110000003_admin_operations.sql`
   - `supabase/migrations/20261119000001_update_room_categories_and_prices.sql`
   - `supabase/migrations/20261122000001_staff_portal_data_api_grants.sql`

   On a fresh database, either run `supabase/seed.sql` or sign in as the owner and use **Room types → Load Kai Lodge catalogue**.
   Both options create the three Kai Lodge categories. Physical-room placeholders remain inactive until you rename and activate them,
   so they cannot accidentally accept bookings.
3. In **Project Settings → API**, copy the project URL, publishable/anon key, and server-only secret/service-role key.
4. In **Authentication → URL Configuration**, set the production **Site URL** and add the callback and password recovery redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR-LIVE-DOMAIN/auth/callback`
   - `http://localhost:3000/auth/callback?flow=recovery`
   - `https://YOUR-LIVE-DOMAIN/auth/callback?flow=recovery`

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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
SUPABASE_SECRET_KEY=YOUR-SERVER-ONLY-SECRET-KEY
NEXT_PUBLIC_SITE_URL=https://YOUR-LIVE-DOMAIN
ADMIN_OWNER_EMAILS=kailodgemv@gmail.com

RESEND_API_KEY=YOUR-RESEND-KEY
CONTACT_EMAIL_TO=kailodgemv@gmail.com
EMAIL_FROM=Kai Lodge Website <bookings@YOUR-DOMAIN>
```

The legacy names `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` also work. Keep `.env.local` and server keys private. Redeploy after changing production environment variables.

## 4. Create the owner account

1. Start the site with `pnpm dev`, or open the deployed site.
2. Visit `/admin/login` and select **New team member? Create an account**.
3. Register with `kailodgemv@gmail.com` and choose a strong password.
4. Open the confirmation email in the browser where you registered, then sign in.

After the email is confirmed, the server automatically adds this user to `admin_users` with the `owner` role on first sign-in.
An owner can assign additional confirmed accounts under **Settings → Team**.

### Reset a staff password

Open `/admin/login` and choose **Forgot password?**. Enter the staff email and open the reset link in the same browser to choose a new password. The account keeps its existing team role. Keep the default Supabase password recovery email link and use the recovery redirect URLs above.

Supabase's default email service delivers only to addresses on the Supabase project team. Configure custom SMTP in Supabase Authentication to send confirmations and reset links to other staff. [Supabase SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp)

## 5. Verify the forms

Submit one test from the contact page and one from the booking page. Both should arrive at `kailodgemv@gmail.com`. If a form says
email is not configured, check `RESEND_API_KEY`, `EMAIL_FROM`, and the verified sending domain, then redeploy.

## Local development

```powershell
pnpm install --frozen-lockfile
pnpm dev
```
