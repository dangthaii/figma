"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="flex justify-between items-center py-3 px-6 border-b">
      <h1
        className="text-xl font-bold cursor-pointer"
        onClick={() => router.push("/")}
      >
        Figma App
      </h1>
      <div className="flex items-center gap-4">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : user ? (
          <>
            <span className="text-sm">{user?.name || user?.username}</span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Đăng xuất
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/login")}
          >
            Đăng nhập
          </Button>
        )}
      </div>
    </header>
  );
}
