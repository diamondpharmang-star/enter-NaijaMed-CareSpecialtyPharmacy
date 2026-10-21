import type { ReactNode } from "react";
import { AlertTriangle, Loader2, PackageOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DataStateVariant = "loading" | "error" | "empty";

interface DataStateNoticeProps {
  variant: DataStateVariant;
  title: string;
  description?: string;
  /** Shown as a "Try again" button for the error variant. */
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
  children?: ReactNode;
}

const ICONS = {
  loading: Loader2,
  error: AlertTriangle,
  empty: PackageOpen,
} as const;

const ICON_WRAPPER_CLASSES: Record<DataStateVariant, string> = {
  loading: "bg-secondary text-primary",
  error: "bg-destructive/10 text-destructive",
  empty: "bg-secondary text-primary",
};

/**
 * Shared loading / empty / error state for catalogue surfaces so a failed
 * request is never rendered as an empty catalogue.
 */
export function DataStateNotice({
  variant,
  title,
  description,
  onRetry,
  isRetrying = false,
  className,
  children,
}: DataStateNoticeProps) {
  const Icon = ICONS[variant];

  return (
    <div
      role={variant === "error" ? "alert" : undefined}
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center",
        className
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full",
          ICON_WRAPPER_CLASSES[variant]
        )}
      >
        <Icon className={cn("h-5 w-5", variant === "loading" && "animate-spin")} />
      </span>
      <p className="font-semibold text-foreground">{title}</p>
      {description && (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} disabled={isRetrying}>
          <RefreshCw className={cn(isRetrying && "animate-spin")} />
          {isRetrying ? "Retrying..." : "Try again"}
        </Button>
      )}
      {children}
    </div>
  );
}
