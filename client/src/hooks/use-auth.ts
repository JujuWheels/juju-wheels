import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

async function fetchUser(): Promise<User | null> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data || null;
}

async function logout(): Promise<void> {
  await fetch("/api/logout", {
    method: "POST",
    credentials: "include",
  });
  window.location.href = "/";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  const profileComplete = !!(user?.phone && user?.marketingEmail && user?.address && user?.city && user?.postalCode && user?.country);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { phone: string; marketingEmail: string; address: string; city: string; postalCode: string; country: string; instagram?: string }) => {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/auth/user"], updatedUser);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    profileComplete,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    updateProfileError: updateProfileMutation.error,
  };
}
