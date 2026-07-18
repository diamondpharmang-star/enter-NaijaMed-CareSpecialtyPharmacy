import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle, Copy } from "lucide-react";
import { PharmacyLayout } from "@/components/pharmacy/PharmacyLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/pharmacy";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Order = Tables<"orders">;

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const flwTransactionId = searchParams.get("transaction_id");
  const flwTxRef = searchParams.get("tx_ref");
  const provider = searchParams.get("provider");
  const isFlutterwaveRedirect = provider === "flutterwave";
  const isKoraRedirect = provider === "kora";
  const [order, setOrder] = useState<Order | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const { bankDetails } = usePaymentSettings();

  useEffect(() => {
    const run = async () => {
      if (reference && !isFlutterwaveRedirect && !isKoraRedirect) {
        setIsVerifying(true);
        const { data } = await supabase.functions.invoke("paystack-verify", {
          body: { reference },
        });
        setIsVerifying(false);
        if (data?.order) {
          setOrder(data.order);
          return;
        }
      }

      if (isKoraRedirect && reference) {
        setIsVerifying(true);
        const response = await fetch("/.netlify/functions/kora-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference, order_id: orderId }),
        });
        const data = await response.json();
        setIsVerifying(false);
        if (data?.order) {
          setOrder(data.order);
          return;
        }
      }

      if (isFlutterwaveRedirect && flwTransactionId) {
        setIsVerifying(true);
        const { data } = await supabase.functions.invoke("flutterwave-verify", {
          body: { transaction_id: flwTransactionId, tx_ref: flwTxRef, order_id: orderId },
        });
        setIsVerifying(false);
        if (data?.order) {
          setOrder(data.order);
          return;
        }
      }

      if (orderId) {
        const { data } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
        setOrder(data);
      }
    };
    run();
  }, [orderId, reference, isFlutterwaveRedirect, isKoraRedirect, flwTransactionId, flwTxRef]);

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(bankDetails.accountNumber);
    toast.success("Account number copied");
  };

  if (isVerifying) {
    return (
      <PharmacyLayout>
        <div className="container flex flex-col items-center gap-4 py-24 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying your payment...</p>
        </div>
      </PharmacyLayout>
    );
  }

  if (!order) {
    return (
      <PharmacyLayout>
        <div className="container py-24 text-center text-muted-foreground">
          Order not found.
        </div>
      </PharmacyLayout>
    );
  }

  const isPaid = order.payment_status === "paid";
  const isFailed = order.payment_status === "failed";
  const isBankTransfer = order.payment_method === "bank_transfer";
  const PAYMENT_METHOD_LABELS: Record<string, string> = {
    paystack: "Paystack",
    flutterwave: "Flutterwave",
    kora: "Kora",
    bank_transfer: "Bank transfer",
  };

  return (
    <PharmacyLayout>
      <div className="container flex flex-col items-center py-16">
        <div className="w-full max-w-xl rounded-xl border border-border bg-card p-8 text-center">
          {isFailed ? (
            <XCircle className="mx-auto h-14 w-14 text-destructive" />
          ) : (
            <CheckCircle2 className="mx-auto h-14 w-14 text-accent" />
          )}

          <h1 className="mt-4 text-2xl font-bold text-foreground">
            {isFailed ? "Payment failed" : "Order placed successfully"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Order reference: <span className="font-medium text-foreground">{order.id.slice(0, 8).toUpperCase()}</span>
          </p>

          <div className="mt-6 rounded-lg bg-secondary/50 p-4 text-left text-sm">
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Total amount</span>
              <span className="font-semibold text-foreground">{formatNaira(Number(order.total_amount))}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Payment method</span>
              <span className="font-medium text-foreground">
                {PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Payment status</span>
              <span className={`font-medium capitalize ${isPaid ? "text-accent" : isFailed ? "text-destructive" : "text-foreground"}`}>
                {order.payment_status}
              </span>
            </div>
          </div>

          {isBankTransfer && !isPaid && (
            <div className="mt-6 rounded-lg border border-primary/30 bg-secondary/30 p-4 text-left">
              <h3 className="font-semibold text-foreground">Complete your bank transfer</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Please transfer the exact order total to the account below. Your order will be
                processed once payment is confirmed.
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank name</span>
                  <span className="font-medium text-foreground">{bankDetails.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account name</span>
                  <span className="font-medium text-foreground">{bankDetails.accountName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Account number</span>
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    {bankDetails.accountNumber}
                    <button onClick={copyAccountNumber} aria-label="Copy account number">
                      <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </span>
                </div>
              </div>
              <p className="mt-4 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                Important: quote your order confirmation number{" "}
                <span className="font-semibold text-foreground">
                  {order.id.slice(0, 8).toUpperCase()}
                </span>{" "}
                in the transfer narration (description) so we can match your payment to this order.
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild variant="outline">
              <Link to="/shop">Continue shopping</Link>
            </Button>
            <Button asChild>
              <Link to="/account/orders">View my orders</Link>
            </Button>
          </div>
        </div>
      </div>
    </PharmacyLayout>
  );
};

export default OrderConfirmation;
