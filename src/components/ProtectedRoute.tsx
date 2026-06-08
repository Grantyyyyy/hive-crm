import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { useLocation } from "wouter";
import { cachedToken, subscribeAuth } from "@/lib/api";
import { AppLoader } from "@/components/AppLoader";

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
    return <AppLoader fullScreen />;
  }

  if (!isSignedIn) {
    return null;
  }

  if (!apiAuth.token) {
    return <AppLoader fullScreen />;
  }

  return <Component {...rest} />;
};
