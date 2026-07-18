import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FLUTTERWAVE_SECRET_KEY = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
    if (!FLUTTERWAVE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Payment provider is not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { transaction_id, tx_ref, order_id } = await req.json();

    let ref = tx_ref;
    if (!ref && order_id) {
      const { data: order } = await supabase
        .from("orders")
        .select("flutterwave_reference")
        .eq("id", order_id)
        .maybeSingle();
      ref = order?.flutterwave_reference;
    }

    if (!transaction_id && !ref) {
      return new Response(JSON.stringify({ error: "No payment reference found." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Flutterwave verification requires the transaction_id returned on redirect.
    if (!transaction_id) {
      return new Response(JSON.stringify({ error: "Missing transaction_id for verification." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verifyResp = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      { headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` } }
    );
    const verifyData = await verifyResp.json();

    if (!verifyResp.ok || verifyData.status !== "success") {
      console.error("Flutterwave verify error:", verifyData);
      return new Response(JSON.stringify({ error: "Failed to verify payment." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const txData = verifyData.data;
    const finalRef = ref || txData.tx_ref;
    const isSuccess = txData.status === "successful" && txData.currency === "NGN";

    const { data: updatedOrder, error } = await supabase
      .from("orders")
      .update({ payment_status: isSuccess ? "paid" : "failed" })
      .eq("flutterwave_reference", finalRef)
      .select()
      .single();

    if (error) {
      console.error("Order update error:", error);
    }

    if (isSuccess && updatedOrder) {
      fetch(`${supabaseUrl}/functions/v1/send-order-notification`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "new_order", order_id: updatedOrder.id }),
      }).catch((e) => console.error("Failed to send order notification:", e));
    }

    return new Response(
      JSON.stringify({ payment_status: isSuccess ? "paid" : "failed", order: updatedOrder }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Unexpected server error." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
