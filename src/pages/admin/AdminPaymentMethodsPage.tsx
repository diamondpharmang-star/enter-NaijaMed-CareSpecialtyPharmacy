import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { usePaymentSettings, type PaymentMethod } from "@/hooks/usePaymentSettings";
import { toast } from "sonner";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, { title: string; description: string }> = {
  paystack: {
    title: "Pay with card / bank via Paystack",
    description: "Secure instant payment — card, bank, or USSD.",
  },
  bank_transfer: {
    title: "Direct bank transfer",
    description: "Customers transfer manually to your bank account.",
  },
};

const AdminPaymentMethodsPage = () => {
  const { settings, isLoading, refetch } = usePaymentSettings();
  const [savingMethod, setSavingMethod] = useState<PaymentMethod | null>(null);

  const handleToggle = async (method: PaymentMethod, checked: boolean) => {
    const otherMethod: PaymentMethod = method === "paystack" ? "bank_transfer" : "paystack";
    if (!checked && !settings[otherMethod]) {
      toast.error("At least one payment method must remain enabled.");
      return;
    }

    setSavingMethod(method);
    const { error } = await supabase
      .from("payment_settings")
      .update({ is_enabled: checked, updated_at: new Date().toISOString() })
      .eq("method", method);
    setSavingMethod(null);

    if (error) {
      toast.error("Failed to update payment method.");
      return;
    }

    toast.success(
      `${PAYMENT_METHOD_LABELS[method].title} ${checked ? "enabled" : "disabled"} for checkout.`
    );
    refetch();
  };

  return (
    <AdminLayout
      title="Payment Methods"
      description="Enable or disable payment methods available to customers at checkout. At least one method must stay enabled."
    >
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="max-w-2xl space-y-4">
          {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
            <div
              key={method}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div>
                <p className="font-medium text-foreground">{PAYMENT_METHOD_LABELS[method].title}</p>
                <p className="text-sm text-muted-foreground">{PAYMENT_METHOD_LABELS[method].description}</p>
              </div>
              <div className="flex items-center gap-2">
                {savingMethod === method && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <Switch
                  checked={settings[method]}
                  disabled={savingMethod === method}
                  onCheckedChange={(checked) => handleToggle(method, checked)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPaymentMethodsPage;
