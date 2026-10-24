import {
  getServerConfig,
  isKoraReference,
  isValidKoraWebhookSignature,
  jsonResponse,
  verifyAndUpdateKoraOrder,
} from "./_shared/kora";

export default async (request: Request) => {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const payload = await request.json();
    const reference = payload?.data?.reference || payload?.reference;
    const signature = request.headers.get("x-korapay-signature");
    const { koraSecretKey } = getServerConfig();
    if (!isValidKoraWebhookSignature(payload?.data, signature, koraSecretKey)) {
      return jsonResponse({ received: true });
    }
    if (!isKoraReference(reference)) {
      return jsonResponse({ error: "No payment reference found." }, 400);
    }

    await verifyAndUpdateKoraOrder(reference);
    return jsonResponse({ received: true });
  } catch (error) {
    console.error("Kora webhook error:", error);
    return jsonResponse({ error: "Unable to process webhook." }, 502);
  }
};
