import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PaymentMethod = "paystack" | "bank_transfer";

export function usePaymentSettings() {
  const [settings, setSettings] = useState<Record<PaymentMethod, boolean>>({
    paystack: true,
    bank_transfer: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(() => {
    return supabase
      .from("payment_settings")
      .select("method, is_enabled")
      .then(({ data }) => {
        if (data) {
          setSettings((prev) => {
            const next = { ...prev };
            data.forEach((row) => {
              next[row.method as PaymentMethod] = row.is_enabled;
            });
            return next;
          });
        }
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { settings, isLoading, refetch };
}
