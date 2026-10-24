import { KORA_API_BASE_URL, getServerConfig, jsonResponse } from "./_shared/kora";

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

export default async (request: Request) => {
  if (request.method === "OPTIONS") return jsonResponse(null);
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const { koraSecretKey, supabase } = getServerConfig();
    const body = (await request.json()) as RequestBody;
    const { customer_name, email, phone, delivery_address, city, state, items } = body;

    if (
      !customer_name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !delivery_address?.trim() ||
      !city?.trim() ||
      !state?.trim() ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return jsonResponse({ error: "Please provide valid checkout details." }, 400);
    }

    const hasInvalidItem = items.some(
      (item) =>
        !item.product_id ||
        !item.product_name ||
        !Number.isFinite(item.unit_price) ||
        item.unit_price <= 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
    );
    if (hasInvalidItem) return jsonResponse({ error: "Cart contains an invalid item." }, 400);

    const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const { data: authData } = accessToken
      ? await supabase.auth.getUser(accessToken)
      : { data: { user: null } };
    const userId = authData.user?.id || null;
    const { data: profile } = userId
      ? await supabase.from("profiles").select("account_type").eq("id", userId).maybeSingle()
      : { data: null };
    const productIds = [...new Set(items.map((item) => item.product_id))];
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, b2b_price, is_active")
      .in("id", productIds);

    if (productsError || !products || products.length !== productIds.length) {
      return jsonResponse({ error: "One or more cart items are unavailable." }, 400);
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const isB2B = profile?.account_type === "b2b";
    const serverItems = items.map((item) => {
      const product = productMap.get(item.product_id);
      const unitPrice = Number(isB2B && product?.b2b_price ? product.b2b_price : product?.price);
      if (!product?.is_active || !Number.isFinite(unitPrice) || unitPrice <= 0) {
        throw new Error("One or more cart items are unavailable.");
      }
      return {
        product_id: product.id,
        product_name: product.name,
        unit_price: unitPrice,
        quantity: item.quantity,
      };
    });
    const totalAmount = serverItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    const reference = `KR-${crypto.randomUUID()}`;
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        customer_name: customer_name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        delivery_address: delivery_address.trim(),
        city: city.trim(),
        state: state.trim(),
        payment_method: "kora",
        payment_status: "pending",
        order_status: "processing",
        total_amount: totalAmount,
        kora_reference: reference,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Kora order creation error:", orderError);
      return jsonResponse({ error: "Failed to create order." }, 500);
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      serverItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
      }))
    );

    if (itemsError) {
      console.error("Kora order items error:", itemsError);
      await supabase.from("orders").delete().eq("id", order.id);
      return jsonResponse({ error: "Failed to save order items." }, 500);
    }

    const siteOrigin = new URL(request.url).origin;
    const koraResponse = await fetch(`${KORA_API_BASE_URL}/charges/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${koraSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: totalAmount,
        currency: "NGN",
        reference,
        redirect_url: `${siteOrigin}/order-confirmation?provider=kora&order_id=${order.id}`,
        notification_url: `${siteOrigin}/.netlify/functions/kora-webhook`,
        customer: {
          name: customer_name.trim(),
          email: email.trim(),
        },
        merchant_bears_cost: false,
        narration: `Diamond Pharma Care order ${order.id.slice(0, 8).toUpperCase()}`,
        metadata: {
          "order-id": order.id,
        },
      }),
    });
    const koraPayload = await koraResponse.json();

    if (!koraResponse.ok || !koraPayload?.status || !koraPayload?.data?.checkout_url) {
      console.error("Kora initialization error:", koraPayload);
      await supabase.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
      return jsonResponse(
        { error: koraPayload?.message || "Failed to initialize Kora payment." },
        502
      );
    }

    return jsonResponse({
      order_id: order.id,
      authorization_url: koraPayload.data.checkout_url,
      reference,
    });
  } catch (error) {
    console.error("Kora initialization error:", error);
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return jsonResponse({ error: message }, message.includes("unavailable") ? 400 : 500);
  }
};
