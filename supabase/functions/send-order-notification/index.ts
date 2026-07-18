import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_EMAIL = "diamondpharmang@gmail.com";
// Using Resend's shared test sender until a custom domain (e.g. diamondpharmacare.ng) is
// verified in the Resend dashboard. Once verified, update this to an address on that domain.
const FROM_EMAIL = "Diamond Pharma Care <onboarding@resend.dev>";

function formatNaira(amount: number): string {
  return `\u20a6${Math.round(amount).toLocaleString("en-NG")}`;
}

interface OrderItemRow {
  product_name: string;
  unit_price: number;
  quantity: number;
}

function renderItemsTable(items: OrderItemRow[]): string {
  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${i.product_name}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${i.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatNaira(i.unit_price * i.quantity)}</td>
      </tr>`
    )
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <thead>
        <tr>
          <th style="padding:8px;text-align:left;border-bottom:2px solid #0d5c66;">Item</th>
          <th style="padding:8px;text-align:center;border-bottom:2px solid #0d5c66;">Qty</th>
          <th style="padding:8px;text-align:right;border-bottom:2px solid #0d5c66;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

async function sendEmail(resendApiKey: string, to: string, subject: string, html: string) {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    console.error("Resend send error:", data);
  }
  return { ok: resp.ok, data };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service is not configured." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, order_id } = await req.json();

    if (!order_id || !type) {
      return new Response(JSON.stringify({ error: "type and order_id are required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: items } = await supabase
      .from("order_items")
      .select("product_name, unit_price, quantity")
      .eq("order_id", order_id);

    const orderRef = order.id.slice(0, 8).toUpperCase();
    const itemsTable = renderItemsTable((items ?? []) as OrderItemRow[]);
    const paymentMethodLabel = {
      bank_transfer: "Bank Transfer",
      paystack: "Paystack",
      flutterwave: "Flutterwave",
      kora: "Kora",
    }[order.payment_method] || order.payment_method;

    if (type === "new_order") {
      const customerHtml = `
        <div style="font-family:Arial,sans-serif;color:#111827;max-width:560px;margin:0 auto;">
          <h2 style="color:#0d5c66;">Thank you for your order, ${order.customer_name}!</h2>
          <p>We've received your order <strong>#${orderRef}</strong> and it is now being processed.</p>
          ${itemsTable}
          <p style="font-size:16px;"><strong>Total: ${formatNaira(Number(order.total_amount))}</strong></p>
          <p><strong>Payment method:</strong> ${paymentMethodLabel}</p>
          <p><strong>Delivery address:</strong> ${order.delivery_address}, ${order.city}, ${order.state}</p>
          <p>We'll email you as your order progresses. Thank you for choosing Diamond Pharma Care.</p>
        </div>`;

      const adminHtml = `
        <div style="font-family:Arial,sans-serif;color:#111827;max-width:560px;margin:0 auto;">
          <h2 style="color:#0d5c66;">New order received — #${orderRef}</h2>
          <p><strong>Customer:</strong> ${order.customer_name}</p>
          <p><strong>Email:</strong> ${order.email} &nbsp; <strong>Phone:</strong> ${order.phone}</p>
          <p><strong>Delivery address:</strong> ${order.delivery_address}, ${order.city}, ${order.state}</p>
          ${itemsTable}
          <p style="font-size:16px;"><strong>Total: ${formatNaira(Number(order.total_amount))}</strong></p>
          <p><strong>Payment method:</strong> ${paymentMethodLabel}</p>
          <p><strong>Payment status:</strong> ${order.payment_status}</p>
        </div>`;

      await sendEmail(RESEND_API_KEY, order.email, `Order Confirmation - #${orderRef}`, customerHtml);
      await sendEmail(RESEND_API_KEY, ADMIN_EMAIL, `New Order Received - #${orderRef}`, adminHtml);
    } else if (type === "status_update") {
      const customerHtml = `
        <div style="font-family:Arial,sans-serif;color:#111827;max-width:560px;margin:0 auto;">
          <h2 style="color:#0d5c66;">Your order has an update</h2>
          <p>Hi ${order.customer_name}, here's the latest on your order <strong>#${orderRef}</strong>:</p>
          <ul style="font-size:14px;">
            <li><strong>Order status:</strong> ${order.order_status}</li>
            <li><strong>Payment status:</strong> ${order.payment_status}</li>
          </ul>
          ${itemsTable}
          <p style="font-size:16px;"><strong>Total: ${formatNaira(Number(order.total_amount))}</strong></p>
          <p>Thank you for choosing Diamond Pharma Care.</p>
        </div>`;

      await sendEmail(RESEND_API_KEY, order.email, `Order Update - #${orderRef}`, customerHtml);
    } else {
      return new Response(JSON.stringify({ error: "Invalid notification type." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Unexpected server error." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
