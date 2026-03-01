This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Web Push Notifications (Optional)

To implement web push notifications for "Match about to start" alerts, you could use the following approach:

1.  **Service Worker:** Create a service worker to handle push events in the background.
2.  **Push Subscription:** Use the `PushManager` API in the browser to subscribe the user to push notifications.
3.  **Store Subscription:** Save the user's push subscription object to your database (e.g., in a `push_subscriptions` table).
4.  **Backend Logic:** Create a backend process (e.g., a Supabase Edge Function or a cron job) that:
    *   Checks for upcoming matches.
    *   Finds users who have subscribed to notifications.
    *   Sends a push notification to the subscribed users using a library like `web-push`.

This would allow you to send timely alerts to your users, even when they don't have the app open.

## Database Setup with Supabase

This project uses Supabase for its database. Follow these steps to set up your database:

1.  **Create a Supabase Project:**
    *   Go to [Supabase](https://supabase.com/) and create a new project.
    *   Note down your Project URL and Anon Key, which you'll use for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your `.env.local` file.

2.  **Run `schema.sql`:**
    *   In your Supabase project dashboard, navigate to the "SQL Editor".
    *   Open the `web-apps/app-quiniela/schema.sql` file from this project.
    *   Copy the content of `schema.sql` and paste it into the Supabase SQL Editor.
    *   Run the query to create the necessary tables (`teams`, `matches`, `predictions`, `pools`, `pool_members`).

3.  **Run `seed.sql` (Optional for Sample Data):**
    *   After running `schema.sql`, you can optionally populate your database with some sample teams and a fictional match schedule.
    *   Open the `web-apps/app-quiniela/seed.sql` file.
    *   Copy its content and paste it into the Supabase SQL Editor.
    *   Run the query to insert the sample data. This is useful for development and testing.

4.  **Enable Row Level Security (RLS):**
    *   For each table, go to "Authentication" -> "Policies" and enable RLS. You'll need to define policies later based on your application's access control requirements.

5.  **Set up Authentication:**
    *   Configure your desired authentication methods (e.g., Email/Password, Google, etc.) in Supabase under "Authentication" -> "Providers".
    *   Ensure your Next.js app's authentication flow (in the `(auth)` route group) integrates with Supabase authentication.
