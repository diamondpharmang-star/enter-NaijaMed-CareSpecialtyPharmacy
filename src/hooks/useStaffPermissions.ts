import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StaffPermissions {
  can_view_orders: boolean;
  can_view_quotes: boolean;
  can_manage_products: boolean;
  can_manage_categories: boolean;
  can_manage_payment_methods: boolean;
}

const NO_PERMISSIONS: StaffPermissions = {
  can_view_orders: false,
  can_view_quotes: false,
  can_manage_products: false,
  can_manage_categories: false,
  can_manage_payment_methods: false,
};

const ALL_PERMISSIONS: StaffPermissions = {
  can_view_orders: true,
  can_view_quotes: true,
  can_manage_products: true,
  can_manage_categories: true,
  can_manage_payment_methods: true,
};

export function useStaffPermissions() {
  const { profile, isLoading: isAuthLoading } = useAuth();
  const [permissions, setPermissions] = useState<StaffPermissions>(NO_PERMISSIONS);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = profile?.role === "admin";
  const isStaff = profile?.role === "staff";

  useEffect(() => {
    if (isAuthLoading) return;

    if (isAdmin) {
      setPermissions(ALL_PERMISSIONS);
      setIsLoading(false);
      return;
    }

    if (isStaff && profile) {
      supabase
        .from("staff_permissions")
        .select("*")
        .eq("user_id", profile.id)
        .maybeSingle()
        .then(({ data }) => {
          setPermissions(data ? { ...NO_PERMISSIONS, ...data } : NO_PERMISSIONS);
          setIsLoading(false);
        });
      return;
    }

    setPermissions(NO_PERMISSIONS);
    setIsLoading(false);
  }, [isAuthLoading, isAdmin, isStaff, profile]);

  return { isAdmin, isStaff, permissions, isLoading: isLoading || isAuthLoading };
}
