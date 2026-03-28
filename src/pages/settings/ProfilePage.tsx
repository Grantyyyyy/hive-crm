import { UserProfile } from "@clerk/clerk-react";
import { User, Shield, Bell } from "lucide-react";

export function ProfilePage() {
  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Profile Settings</h1>
        <p className="text-text-muted mt-2">Manage your account credentials and personal information.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-1">
          <nav className="flex flex-col space-y-1">
            <button className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl bg-accent/10 text-accent transition-all ring-1 ring-accent/20">
              <User className="w-4 h-4" />
              General
            </button>
            <button className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-text-muted hover:bg-bg-surface hover:text-text-primary transition-all">
              <Shield className="w-4 h-4" />
              Security
            </button>
            <button className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-text-muted hover:bg-bg-surface hover:text-text-primary transition-all">
              <Bell className="w-4 h-4" />
              Notifications
            </button>
          </nav>
        </div>

        {/* Clerk UserProfile */}
        <div className="flex-1 max-w-4xl">
          <div className="rounded-2xl border border-border bg-bg-surface shadow-xl shadow-accent/5 overflow-hidden">
            <UserProfile
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-none bg-transparent w-full",
                  navbar: "hidden", // We use our own navbar
                  pageScrollBox: "p-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  profileSectionTitle: "text-lg font-semibold text-text-primary border-b border-border pb-4 mb-6",
                  formButtonPrimary: "bg-accent hover:bg-accent/90 text-sm font-bold h-10 rounded-xl transition-all",
                  formFieldInput: "flex h-11 w-full rounded-xl border border-border bg-bg-elevated px-4 py-2 text-sm ring-offset-bg-surface file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
                  userPreviewMainIdentifier: "text-text-primary font-semibold",
                  userPreviewSecondaryIdentifier: "text-text-muted",
                  identityPreviewText: "text-text-primary",
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
