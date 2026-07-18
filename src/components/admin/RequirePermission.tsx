import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useStaffPermissions, type StaffPermissions } from "@/hooks/useStaffPermissions";

interface RequirePermissionProps {
  permission: keyof StaffPermissions;
  children: ReactNode;
}

/**
 * Gates admin sub-page content behind a specific staff permission.
 * Admins always pass. Staff without the permission are redirected to the dashboard.
 * Must be rendered inside an already-authenticated AdminLayout.
 */
export function RequirePermission({ permission, children }: RequirePermissionProps) {
  const { isAdmin, permissions, isLoading } = useStaffPermissions();

  if (isLoading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (!isAdmin && !permissions[permission]) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
