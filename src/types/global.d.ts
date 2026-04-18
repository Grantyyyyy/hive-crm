import '@supabase/supabase-js';

declare global {
  interface SupabaseAuthClient {
    getSession(): Promise<{ data: { session: any }; error: any }>;
    onAuthStateChange(callback: (event: string, session: any) => void): { data: { subscription: { unsubscribe: () => void } } };
    signOut(): Promise<{ error: any }>;
    signInWithPassword(credentials: { email: string; password: string }): Promise<{ error: any }>;
    signUp(options: { email: string; password: string }): Promise<{ error: any }>;
    updateUser(updates: { data: any }): Promise<{ data: { user: any }; error: any }>;
    admin: {
      inviteUserByEmail(email: string, options?: { data?: any; redirectTo?: string }): Promise<{ data: { user: any }; error: any }>;
      createUser(options: { email: string; password: string; email_confirm?: boolean }): Promise<{ data: any; error: any }>;
    };
  }

  export type AuthSession = any;
  export type AuthUser = any;
}

declare module '@dnd-kit/core';
declare module '@dnd-kit/sortable';
declare module '@dnd-kit/utilities';
declare module '@supabase/ssr';
declare module 'jspdf' {
  const jsPDF: any;
  export default jsPDF;
}
declare module 'html2canvas' {
  function html2canvas(element: HTMLElement, options?: any): Promise<any>;
  export default html2canvas;
}