import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PaymentMethod = "paystack" | "bank_transfer";

export interface BankTransferDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

const DEFAULT_BANK_DETAILS: BankTransferDetails = {
  bankName: "",
  accountName: "",
  accountNumber: "",
};

export function usePaymentSettings() {
  const [settings, setSettings] = useState<Record<PaymentMethod, boolean>>({
    paystack: true,
    bank_transfer: true,
  });
  const [bankDetails, setBankDetails] = useState<BankTransferDetails>(DEFAULT_BANK_DETAILS);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(() => {
    return supabase
      .from("payment_settings")
      .select("method, is_enabled, bank_name, account_name, account_number")
      .then(({ data }) => {
        if (data) {
          setSettings((prev) => {
            const next = { ...prev };
            data.forEach((row) => {
              next[row.method as PaymentMethod] = row.is_enabled;
            });
            return next;
          });

          const bankRow = data.find((row) => row.method === "bank_transfer");
          if (bankRow) {
            setBankDetails({
              bankName: bankRow.bank_name ?? "",
              accountName: bankRow.account_name ?? "",
              accountNumber: bankRow.account_number ?? "",
            });
          }
        }
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { settings, bankDetails, isLoading, refetch };
}
