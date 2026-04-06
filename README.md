# Clerk Auth App with React, Vite, and Wouter

A complete React application built from scratch to demonstrate authentication using Clerk and routing using Wouter, styled with Tailwind CSS v4 and shadcn/ui principles.

## Features

- **Vite Setup**: Fast and lean React SPA with TypeScript.
- **Clerk Authentication**: Secure sign-up, sign-in, and session management.
- **User Invitations**: Admin can create user accounts and send invitation emails (see [INVITATION_SETUP.md](./INVITATION_SETUP.md)).
- **Wouter**: Lightweight routing without external dependencies like React Router.
- **Tailwind CSS v4**: Utility-first styling with modern features.
- **shadcn/ui Utilities**: Custom UI components crafted using `cva` and `clsx`.

## Prerequisites

- Node.js (v18 or newer recommended)
- A Clerk Account (Sign up at [https://dashboard.clerk.com](https://dashboard.clerk.com))

## Step-by-Step Setup

1. **Install Dependencies**

   ```bash
   pnpm install
   ```

2. **Configure Clerk**

   - Create a new application in your Clerk Dashboard.
   - Copy your **Publishable Key** and **Secret Key** from the Clerk Dashboard API Keys section.
   - Create a `.env.local` file in the root of the project (see `.env.local.example`).
   - Add your keys:

     ```env
     VITE_CLERK_PUBLISHABLE_KEY=pk_test_... (your publishable key)
     CLERK_SECRET_KEY=sk_test_... (your secret key)
     VITE_APP_URL=http://localhost:5173
     ```

3. **Run the Development Server**

   ```bash
   # Run Vite frontend
   pnpm run dev

   # (Optional) Run API server for user invitations
   pnpm run dev:api
   ```

   The app will typically be available at `http://localhost:5173`.

## User Invitation Feature

Admins can create user accounts directly from the **Settings → Users** page:

1. Click **Add User**
2. Choose **Send Invite** (sends email) or **Manual Add** (placeholder)
3. Enter user details and role
4. User receives invitation email with password setup link

> 📧 **Note:** The invitation feature requires the API server to be running (`pnpm run dev:api`) or deployment to a serverless platform (Vercel, Netlify).

See [INVITATION_SETUP.md](./INVITATION_SETUP.md) for detailed setup instructions.

## Project Structure

- `src/App.tsx`: Main entry point configuring the `<ClerkProvider>` and Wouter `<Router>`.
- `src/components/ProtectedRoute.tsx`: A wrapper that ensures child routes are only accessible to authenticated users.
- `src/pages/`: Contains the specific page components (Dashboard, Contacts, Deals, Tasks, etc.).
- `src/pages/settings/Users.tsx`: User management with invitation system.
- `src/lib/settingsService.ts`: Supabase-based user/role management service.
- `src/server/api/`: Backend API endpoints for Clerk integrations.
- `scripts/dev-api.ts`: Development API server for local testing.

## Scripts

- `pnpm run dev` - Start Vite development server
- `pnpm run dev:api` - Start local API server for Clerk invitations
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run lint` - Run ESLint

## Authentication Flow

- The **Landing Page** (`/`) is public.
- The **Sign In** and **Sign Up** pages (`/sign-in`, `/sign-up`) handle the Auth UI via Clerk.
- After a successful login or sign-up, users are redirected to the **Dashboard** (`/dashboard`).
- The **Dashboard** is protected and will redirect unauthenticated users back to the sign-in page.
- **Invited users** receive an email with a link to set their password and activate their account.
