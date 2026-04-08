import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Basic client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Creates a Supabase browser client with cookie-based auth.
 * This client automatically manages sessions via cookies and is
 * the recommended way to use Supabase Auth in a browser environment.
 *
 * Uses @supabase/ssr's createBrowserClient which handles cookie
 * storage and session persistence without manual JWT management.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Creates an authenticated Supabase client using a Clerk JWT
 * @deprecated Use createSupabaseBrowserClient() or the base `supabase` export instead.
 * This will be removed once the Clerk → Supabase Auth migration is complete.
 */
export function createClerkSupabaseClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })
}
