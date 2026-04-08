import { useUser } from "@/lib/AuthContext";

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
 * Uses full_name initials, or first 2 chars of username, or "?" as fallback.
 */
export function getUserInitials(user: NonNullable<Parameters<typeof import("@/lib/helpers").getUserInitials>[0]>): string {
  if (!user) return "?";

  if (user.user_metadata?.full_name) {
    const parts = user.user_metadata.full_name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  }

  if (user.user_metadata?.user_name) {
    return user.user_metadata.user_name.slice(0, 2).toUpperCase();
  }

  if (user.email) {
    return user.email.slice(0, 2).toUpperCase();
  }

  return "?";
}

/**
 * Returns the current user's display name.
 * Uses full_name, or username, or "Guest User" as fallback.
 */
export function getUserDisplayName(user: NonNullable<Parameters<typeof import("@/lib/helpers").getUserInitials>[0]>): string {
  if (!user) return "Guest User";

  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name;
  }

  if (user.user_metadata?.user_name) {
    return user.user_metadata.user_name;
  }

  return "Guest User";
}
