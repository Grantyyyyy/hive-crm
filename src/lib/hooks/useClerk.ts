import { useUser } from "@clerk/clerk-react";

/**
 * Returns the current user's ID, or an empty string if not authenticated.
 * Use this hook to consistently access the user ID across the application.
 */
export function useUserId(): string {
  const { user } = useUser();
  return user?.id ?? "";
}

/**
 * Returns the current user's display initials.
 * Uses firstName + lastName initials, or first 2 chars of username, or "?" as fallback.
 */
export function getUserInitials(user: NonNullable<Parameters<typeof import("@/lib/helpers").getUserInitials>[0]>): string {
  if (!user) return "?";

  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }

  if (user.username) {
    return user.username.slice(0, 2).toUpperCase();
  }

  if ((user as any).primaryEmailAddress?.emailAddress) {
    return (user as any).primaryEmailAddress.emailAddress.slice(0, 2).toUpperCase();
  }

  return "?";
}

/**
 * Returns the current user's display name.
 * Uses firstName + lastName, or username, or "Guest User" as fallback.
 */
export function getUserDisplayName(user: NonNullable<Parameters<typeof import("@/lib/helpers").getUserInitials>[0]>): string {
  if (!user) return "Guest User";

  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  if (user.username) {
    return user.username;
  }

  return "Guest User";
}
