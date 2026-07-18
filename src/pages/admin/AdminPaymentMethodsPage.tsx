import { useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RequirePermission } from "@/components/admin/RequirePermission";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePaymentSettings, type PaymentMethod } from "@/hooks/usePaymentSettings";
import { toast } from "sonner";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, { title: string; description: string }> = {
  paystack: {
    title: "Pay with card / bank via Paystack",
    description: "Secure instant payment — card, bank, or USSD.",
  },
  flutterwave: {
    title: "Pay with card / bank via Flutterwave",
    description: "Secure instant payment — card, bank transfer, USSD, or mobile money.",
  },
  kora: {
    title: "Pay with card / bank via Kora",
    description: "Secure Nigerian payment through Kora hosted checkout.",
  },
  bank_transfer: {
    title: "Direct bank transfer",
    description: "Customers transfer manually to your bank account.",
  },
};

function BankDetailsForm({
  bankName,
  accountName,
  accountNumber,
  onSaved,
}: {
  bankName: string;
  accountName: string;
  accountNumber: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ bankName, accountName, accountNumber });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm({ bankName, accountName, accountNumber });
  }, [bankName, accountName, accountNumber]);

  const isDirty =
    form.bankName !== bankName || form.accountName !== accountName || form.accountNumber !== accountNumber;

  const updateField = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.bankName.trim() || !form.accountName.trim() || !form.accountNumber.trim()) {
      toast.error("Please fill in all bank details.");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from("payment_settings")
      .update({
        bank_name: form.bankName.trim(),
        account_name: form.accountName.trim(),
        account_number: form.accountNumber.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("method", "bank_transfer");
    setIsSaving(false);

    if (error) {
      toast.error("Failed to update bank details.");
      return;
    }

    toast.success("Bank transfer details updated.");
    onSaved();
  };

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-medium text-foreground">Bank account details shown to customers</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="bank_name" className="text-xs">Bank name</Label>
          <Input
            id="bank_name"
            value={form.bankName}
            onChange={(e) => updateField("bankName", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="account_name" className="text-xs">Account name</Label>
          <Input
            id="account_name"
            value={form.accountName}
            onChange={(e) => updateField("accountName", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="account_number" className="text-xs">Account number</Label>
          <Input
            id="account_number"
            value={form.accountNumber}
            onChange={(e) => updateField("accountNumber", e.target.value)}
          />
        </div>
      </div>
      <Button size="sm" disabled={!isDirty || isSaving} onClick={handleSave}>
        {isSaving ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="mr-2 h-3.5 w-3.5" />
        )}
        Save bank details
      </Button>
    </div>
  );
}

const AdminPaymentMethodsPage = () => {
  const { settings, bankDetails, isLoading, refetch } = usePaymentSettings();
  const [savingMethod, setSavingMethod] = useState<PaymentMethod | null>(null);

  const handleToggle = async (method: PaymentMethod, checked: boolean) => {
    const otherMethodsEnabled = (Object.keys(settings) as PaymentMethod[]).some(
      (m) => m !== method && settings[m]
    );
    if (!checked && !otherMethodsEnabled) {
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
      <RequirePermission permission="can_manage_payment_methods">
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="max-w-2xl space-y-4">
          {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
            <div key={method}>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
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
              {method === "bank_transfer" && (
                <BankDetailsForm
                  bankName={bankDetails.bankName}
                  accountName={bankDetails.accountName}
                  accountNumber={bankDetails.accountNumber}
                  onSaved={refetch}
                />
              )}
            </div>
          ))}
        </div>
      )}
      </RequirePermission>
    </AdminLayout>
  );
};

export default AdminPaymentMethodsPage;
