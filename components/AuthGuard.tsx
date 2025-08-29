"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageLoading } from "@/components/ui/loading";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, requireAuth, isAuthenticated, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return <PageLoading message="Đang kiểm tra xác thực..." />;
  }

  // If authentication is required and user is not authenticated, redirect
  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect to login
  }

  // If authentication is not required or user is authenticated, show children
  return <>{children}</>;
}
