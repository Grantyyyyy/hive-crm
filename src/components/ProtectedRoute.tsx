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

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-r-transparent"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    navigate("/sign-in");
    return null;
  }

  if (!apiAuth.token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-r-transparent"></div>
      </div>
    );
  }

  return <Component {...rest} />;
};
