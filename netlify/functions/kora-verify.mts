import { isKoraReference, jsonResponse, verifyAndUpdateKoraOrder } from "./_shared/kora";

export default async (request: Request) => {
  if (request.method === "OPTIONS") return jsonResponse(null);
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const body = await request.json();
    const reference = body?.reference;
    const orderId = body?.order_id;
    if (!isKoraReference(reference) || typeof orderId !== "string") {
      return jsonResponse({ error: "Invalid payment verification request." }, 400);
    }

    return jsonResponse(await verifyAndUpdateKoraOrder(reference, orderId));
  } catch (error) {
    console.error("Kora verification error:", error);
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return jsonResponse({ error: message }, message === "Order not found." ? 404 : 502);
  }
};
