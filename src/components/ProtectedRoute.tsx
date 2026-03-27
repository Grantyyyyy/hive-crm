import React from "react";
import { useAuth } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { cachedToken, cachedOrgId, subscribeAuth } from "@/lib/api";

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  [key: string]: any;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
  ...rest
}) => {
  const { isSignedIn, isLoaded } = useAuth();
  const [, navigate] = useLocation();
  const [apiAuth, setApiAuth] = React.useState({ token: cachedToken, orgId: cachedOrgId });

  React.useEffect(() => {
    return subscribeAuth(setApiAuth);
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    navigate("/sign-in");
    return null;
  }

  // Only block if we don't have a token yet. 
  // orgId can be null if the user has no organization.
  if (!apiAuth.token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    );
  }

  return <Component {...rest} />;
};
