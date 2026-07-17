import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Copy, Info } from "lucide-react";
import { PharmacyLayout } from "@/components/pharmacy/PharmacyLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/pharmacy";
import { NIGERIAN_STATES, BANK_TRANSFER_DETAILS } from "@/lib/nigeria";
import { toast } from "sonner";

const Checkout = () => {
  const { items, totalAmount, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "bank_transfer">("paystack");
  const [confirmedOrder, setConfirmedOrder] = useState<{
    id: string;
    total: number;
    items: typeof items;
  } | null>(null);

  const [form, setForm] = useState({
    customer_name: profile?.full_name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    delivery_address: "",
    city: "",
    state: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    form.customer_name && form.email && form.phone && form.delivery_address && form.city && form.state;

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(BANK_TRANSFER_DETAILS.accountNumber);
    toast.success("Account number copied");
  };

  const handlePlaceOrder = async () => {
    if (!isFormValid || items.length === 0) return;
    setIsSubmitting(true);

    try {
      if (paymentMethod === "paystack") {
        const { data, error } = await supabase.functions.invoke("paystack-initialize", {
          body: {
            user_id: user?.id || null,
            customer_name: form.customer_name,
            email: form.email,
            phone: form.phone,
            delivery_address: form.delivery_address,
            city: form.city,
            state: form.state,
            items: items.map((i) => ({
              product_id: i.product_id,
              product_name: i.product_name,
              unit_price: i.unit_price,
              quantity: i.quantity,
            })),
          },
        });

        if (error || data?.error) {
          throw new Error(data?.error || error?.message || "Failed to initialize payment.");
        }

        clearCart();
        window.location.href = data.authorization_url;
      } else {
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user?.id || null,
            customer_name: form.customer_name,
            email: form.email,
            phone: form.phone,
            delivery_address: form.delivery_address,
            city: form.city,
            state: form.state,
            payment_method: "bank_transfer",
            payment_status: "pending",
            order_status: "processing",
            total_amount: totalAmount,
          })
          .select()
          .single();

        if (orderError || !order) throw new Error("Failed to create order.");

        const { error: itemsError } = await supabase.from("order_items").insert(
          items.map((i) => ({
            order_id: order.id,
            product_id: i.product_id,
            product_name: i.product_name,
            unit_price: i.unit_price,
            quantity: i.quantity,
          }))
        );

        if (itemsError) throw new Error("Failed to save order items.");

        supabase.functions
          .invoke("send-order-notification", { body: { type: "new_order", order_id: order.id } })
          .catch((e) => console.error("Failed to send order notification:", e));

        setConfirmedOrder({ id: order.id, total: totalAmount, items });
        clearCart();
        setIsSubmitting(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !confirmedOrder) {
    navigate("/cart");
    return null;
  }

  return (
    <PharmacyLayout>
      <div className="container py-10">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Checkout</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Contact &amp; Delivery Information</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="customer_name">Full name</Label>
                  <Input
                    id="customer_name"
                    value={form.customer_name}
                    onChange={(e) => updateField("customer_name", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="080..."
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="delivery_address">Delivery address</Label>
                  <Input
                    id="delivery_address"
                    value={form.delivery_address}
                    onChange={(e) => updateField("delivery_address", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Select value={form.state} onValueChange={(v) => updateField("state", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {NIGERIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Payment Method</h2>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-input p-4 has-[:checked]:border-primary has-[:checked]:bg-secondary/60">
                  <RadioGroupItem value="paystack" id="paystack" />
                  <div>
                    <p className="font-medium text-foreground">Pay with card / bank via Paystack</p>
                    <p className="text-sm text-muted-foreground">Secure instant payment — card, bank, or USSD.</p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-input p-4 has-[:checked]:border-primary has-[:checked]:bg-secondary/60">
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <div>
                    <p className="font-medium text-foreground">Direct bank transfer</p>
                    <p className="text-sm text-muted-foreground">
                      We'll show you our account details to complete a manual transfer.
                    </p>
                  </div>
                </label>
              </RadioGroup>

              {paymentMethod === "bank_transfer" && (
                <div className="mt-4 rounded-lg border border-primary/30 bg-secondary/30 p-4">
                  <h3 className="font-semibold text-foreground">Bank transfer details</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Transfer the exact order total to the account below. Your order will be
                    processed once payment is confirmed.
                  </p>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank</span>
                      <span className="font-medium text-foreground">{BANK_TRANSFER_DETAILS.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account name</span>
                      <span className="font-medium text-foreground">{BANK_TRANSFER_DETAILS.accountName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Account number</span>
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        {BANK_TRANSFER_DETAILS.accountNumber}
                        <button type="button" onClick={copyAccountNumber} aria-label="Copy account number">
                          <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    <span>
                      Note: after placing your order, you'll be given an order confirmation
                      number — please write/quote it in the transfer narration (description) when
                      sending your payment, so we can match it to your order.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="h-fit rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              {items.map((item) => (
                <div key={item.product_id} className="flex justify-between text-muted-foreground">
                  <span className="line-clamp-1 pr-2">
                    {item.product_name} × {item.quantity}
                  </span>
                  <span className="shrink-0">{formatNaira(item.unit_price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-bold text-foreground">
              <span>Total</span>
              <span>{formatNaira(totalAmount)}</span>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
              <span>Note: the cost of delivery is not included in the price above. Delivery fees will be communicated separately.</span>
            </div>
            <Button
              className="mt-6 w-full"
              size="lg"
              disabled={!isFormValid || isSubmitting}
              onClick={handlePlaceOrder}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Place order
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={!!confirmedOrder}
        onOpenChange={(open) => {
          if (!open && confirmedOrder) {
            const orderId = confirmedOrder.id;
            setConfirmedOrder(null);
            navigate(`/order-confirmation?order_id=${orderId}`);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order confirmed</DialogTitle>
            <DialogDescription>
              Thank you! Your order has been placed successfully. Here's a summary of your order.
            </DialogDescription>
          </DialogHeader>
          {confirmedOrder && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order reference</span>
                <span className="font-medium text-foreground">
                  {confirmedOrder.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="space-y-2 border-t border-border pt-3">
                {confirmedOrder.items.map((item) => (
                  <div key={item.product_id} className="flex justify-between text-muted-foreground">
                    <span className="line-clamp-1 pr-2">
                      {item.product_name} × {item.quantity}
                    </span>
                    <span className="shrink-0">{formatNaira(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-bold text-foreground">
                <span>Total</span>
                <span>{formatNaira(confirmedOrder.total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Delivery cost is not included and will be communicated separately.
              </p>
              <p className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                Please quote your order reference{" "}
                <span className="font-semibold text-foreground">
                  {confirmedOrder.id.slice(0, 8).toUpperCase()}
                </span>{" "}
                in the transfer narration when making your bank transfer.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => {
                const orderId = confirmedOrder?.id;
                setConfirmedOrder(null);
                if (orderId) navigate(`/order-confirmation?order_id=${orderId}`);
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PharmacyLayout>
  );
};

export default Checkout;
