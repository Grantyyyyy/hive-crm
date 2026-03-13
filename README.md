# Clerk Auth App with React, Vite, and Wouter

A complete React application built from scratch to demonstrate authentication using Clerk and routing using Wouter, styled with Tailwind CSS v4 and shadcn/ui principles.

## Features

- **Vite Setup**: Fast and lean React SPA with TypeScript.
- **Clerk Authentication**: Secure sign-up, sign-in, and session management.
- **Wouter**: Lightweight routing without external dependencies like React Router.
- **Tailwind CSS v4**: Utility-first styling with modern features.
- **shadcn/ui Utilities**: Custom UI components crafted using `cva` and `clsx`.

## Prerequisites

- Node.js (v18 or newer recommended)
- A Clerk Account (Sign up at [https://dashboard.clerk.com](https://dashboard.clerk.com))

## Step-by-Step Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Configure Clerk**

   - Create a new application in your Clerk Dashboard.
   - Copy your **Publishable Key** from the Clerk Dashboard API Keys section.
   - Create a `.env.local` file in the root of the project (one has been provided as an example).
   - Add your publishable key:

     ```env
     VITE_CLERK_PUBLISHABLE_KEY=pk_test_... (your key here)
     ```

3. **Run the Development Server**

   ```bash
   npm run dev
   ```

   The app will typically be available at `http://localhost:5173`.

## Project Structure

- `src/App.tsx`: Main entry point configuring the `<ClerkProvider>` and Wouter `<Router>`.
- `src/components/ProtectedRoute.tsx`: A wrapper that ensures child routes are only accessible to authenticated users.
- `src/pages/`: Contains the specific page components (`LandingPage`, `Dashboard`, `SignInPage`, `SignUpPage`).
- `src/lib/utils.ts`: Utility function (`cn`) for conditionally merging Tailwind classes.

## Authentication Flow

- The **Landing Page** (`/`) is public.
- The **Sign In** and **Sign Up** pages (`/sign-in`, `/sign-up`) handle the Auth UI via Clerk.
- After a successful login or sign-up, users are redirected to the **Dashboard** (`/dashboard`).
- The **Dashboard** is protected and will redirect unauthenticated users back to the sign-in page.
