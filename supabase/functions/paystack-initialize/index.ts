import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CartItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
}

interface RequestBody {
  user_id: string | null;
  customer_name: string;
  email: string;
  phone: string;
  delivery_address: string;
  city: string;
  state: string;
  items: CartItem[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Payment provider is not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: RequestBody = await req.json();
    const { user_id, customer_name, email, phone, delivery_address, city, state, items } = body;

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const total_amount = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user_id || null,
        customer_name,
        email,
        phone,
        delivery_address,
        city,
        state,
        payment_method: "paystack",
        payment_status: "pending",
        order_status: "processing",
        total_amount,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      return new Response(JSON.stringify({ error: "Failed to create order." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderItems = items.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      product_name: i.product_name,
      unit_price: i.unit_price,
      quantity: i.quantity,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) {
      console.error("Order items error:", itemsError);
      return new Response(JSON.stringify({ error: "Failed to save order items." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") || "";
    const paystackResp = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(total_amount * 100), // kobo
        reference: `DPC-${order.id}`,
        callback_url: `${origin}/order-confirmation?order_id=${order.id}`,
        metadata: { order_id: order.id },
      }),
    });

    const paystackData = await paystackResp.json();

    if (!paystackResp.ok || !paystackData.status) {
      console.error("Paystack init error:", paystackData);
      return new Response(
        JSON.stringify({ error: paystackData.message || "Failed to initialize payment." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("orders")
      .update({ paystack_reference: paystackData.data.reference })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({
        order_id: order.id,
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
      }),
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
