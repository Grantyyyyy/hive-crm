import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useLocation } from "wouter";
import { cachedToken, subscribeAuth } from "@/lib/api";

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
  const [apiAuth, setApiAuth] = React.useState({ token: cachedToken });

  React.useEffect(() => {
    return subscribeAuth(setApiAuth);
  }, []);

  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/sign-in");
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  if (!apiAuth.token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent"></div>
      </div>
    );
  }

  return <Component {...rest} />;
};
