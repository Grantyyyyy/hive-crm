import { useUser, useClerk } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

export function Dashboard() {
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-muted/20">
      <div className="container mx-auto p-4 md:p-8 max-w-5xl">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Welcome back, <span className="font-medium text-foreground">{user?.firstName || user?.username || "User"}</span>!
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => signOut({ redirectUrl: '/' })}
            >
              Sign Out
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col space-y-1.5 p-6 border-b border-border/50 bg-muted/10">
                <h3 className="font-semibold leading-none tracking-tight">Profile Information</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img 
                      src={user?.imageUrl} 
                      alt="Profile" 
                      className="h-16 w-16 rounded-full border-2 border-primary/20 object-cover"
                    />
                    <div className="absolute inset-0 rounded-full shadow-inner pointer-events-none" />
                  </div>
                  <div>
                    <p className="text-base font-medium leading-none">{user?.fullName}</p>
                    <p className="text-sm text-muted-foreground mt-1.5">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col space-y-1.5 p-6 border-b border-border/50 bg-muted/10">
                <h3 className="font-semibold leading-none tracking-tight">Account Details</h3>
              </div>
              <div className="p-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">User ID</p>
                    <p className="font-medium font-mono text-xs truncate" title={user?.id}>{user?.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Last Signed In</p>
                    <p className="font-medium">
                      {user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col space-y-1.5 p-6 border-b border-border/50 bg-primary/[0.03]">
                <h3 className="font-semibold leading-none tracking-tight">Next Steps</h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your application is now fully configured with Clerk Authentication and Wouter!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
