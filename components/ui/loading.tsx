import { cn } from "@/lib/utils";

// Spinner component
export function Spinner({
  className,
  size = "default",
}: {
  className?: string;
  size?: "sm" | "default" | "lg";
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
}

// Loading dots animation
export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
      <div
        className="w-2 h-2 bg-current rounded-full animate-bounce"
        style={{ animationDelay: "0.1s" }}
      ></div>
      <div
        className="w-2 h-2 bg-current rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      ></div>
    </div>
  );
}

// Typing indicator
export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="text-sm text-muted-foreground mr-2">AI đang xử lý</span>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
        <div
          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></div>
      </div>
    </div>
  );
}

// Skeleton component for content loading
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

// Chat message skeleton
export function ChatMessageSkeleton() {
  return (
    <div className="text-sm leading-6">
      <div className="inline-block rounded-2xl px-4 py-2 bg-muted">
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
}

// Sidebar item skeleton
export function SidebarItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-4 flex-1" />
    </div>
  );
}

// Project selector skeleton
export function ProjectSelectorSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

// Button loading state
export function ButtonLoading({
  children,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading ? (
        <div className="flex items-center gap-2">
          <Spinner size="sm" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}

// Page loading overlay
export function PageLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Content loading wrapper
export function ContentLoading({
  loading,
  children,
  skeleton,
  fallback,
}: {
  loading: boolean;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  if (loading) {
    return skeleton || fallback || <PageLoading />;
  }
  return <>{children}</>;
}
