import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";

const KORA_API_BASE_URL = "https://api.korapay.com/merchant/api/v1";

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Content-Type": "application/json",
    },
  });

export const getServerConfig = () => {
  const koraSecretKey = process.env.KORA_SECRET_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!koraSecretKey || !supabaseUrl || !supabaseServiceKey) {
    throw new Error("Payment provider is not configured.");
  }

  return {
    koraSecretKey,
    supabaseUrl,
    supabaseServiceKey,
    supabase: createClient(supabaseUrl, supabaseServiceKey),
  };
};

export const queryKoraCharge = async (reference: string, secretKey: string) => {
  const response = await fetch(`${KORA_API_BASE_URL}/charges/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const payload = await response.json();

  if (!response.ok || !payload?.status || !payload?.data) {
    throw new Error(payload?.message || "Failed to verify payment.");
  }

  return payload.data;
};

export const isKoraReference = (reference: unknown): reference is string =>
  typeof reference === "string" && /^KR-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reference);

export const isValidKoraWebhookSignature = (
  data: unknown,
  signature: string | null,
  secretKey: string
) => {
  if (!signature) return false;

  const expectedSignature = createHmac("sha256", secretKey)
    .update(JSON.stringify(data))
    .digest("hex");
  const received = Buffer.from(signature.trim().toLowerCase(), "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  return received.length === expected.length && timingSafeEqual(received, expected);
};

export const verifyAndUpdateKoraOrder = async (reference: string, expectedOrderId?: string) => {
  const { koraSecretKey, supabase, supabaseUrl, supabaseServiceKey } = getServerConfig();
  let orderQuery = supabase
    .from("orders")
    .select("*")
    .eq("kora_reference", reference);
  if (expectedOrderId) orderQuery = orderQuery.eq("id", expectedOrderId);
  const { data: order, error: orderError } = await orderQuery.maybeSingle();

  if (orderError || !order) {
    throw new Error("Order not found.");
  }

  const charge = await queryKoraCharge(reference, koraSecretKey);
  const chargeStatus = String(charge.status || "").toLowerCase();
  const amountMatches = Number(charge.amount) === Number(order.total_amount);
  const currencyMatches = String(charge.currency || "").toUpperCase() === "NGN";
  const referenceMatches = charge.reference === reference;
  const isPaid =
    chargeStatus === "success" && amountMatches && currencyMatches && referenceMatches;
  const isFailed = ["failed", "cancelled", "abandoned", "declined", "expired"].includes(
    chargeStatus
  );
  const paymentStatus =
    order.payment_status === "paid" ? "paid" : isPaid ? "paid" : isFailed ? "failed" : "pending";

  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({ payment_status: paymentStatus })
    .eq("id", order.id)
    .select()
    .single();

  if (updateError || !updatedOrder) {
    throw new Error("Failed to update order payment status.");
  }

  if (isPaid && order.payment_status !== "paid") {
    await fetch(`${supabaseUrl}/functions/v1/send-order-notification`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "new_order", order_id: updatedOrder.id }),
    }).catch((error) => console.error("Failed to send order notification:", error));
  }

  return { payment_status: paymentStatus, order: updatedOrder };
};

export { KORA_API_BASE_URL };
