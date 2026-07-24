import { PharmacyLayout } from "@/components/pharmacy/PharmacyLayout";
import { Seo } from "@/components/seo/Seo";
import { WHATSAPP_NUMBER, WHATSAPP_LINK } from "@/lib/pharmacy";
import { buildMerchantReturnPolicyJsonLd, SUPPORT_EMAIL, STORE_ADDRESS } from "@/lib/seo";

const ReturnRefundPolicy = () => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <PharmacyLayout>
      <Seo
        title="Return & Refund Policy"
        description="Diamond Pharma Care's return and refund policy: eligibility window, accepted return reasons, refund methods and timelines, and how to request a return for oncology, rare disease, diabetes, and other specialty medication orders."
        path="/return-refund-policy"
        jsonLd={buildMerchantReturnPolicyJsonLd(origin)}
      />
      <section className="border-b border-border bg-gradient-subtle">
        <div className="container py-10">
          <h1 className="text-3xl font-bold text-foreground">Return &amp; Refund Policy</h1>
          <p className="mt-2 text-muted-foreground">Last updated: July 2026</p>
        </div>
      </section>

      <section className="container max-w-3xl py-10">
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">1. Return Window</h2>
            <p>
              You may request a return or refund within{" "}
              <strong className="text-foreground">48 hours (2 days)</strong> of delivery, and only
              for the eligible reasons listed in Section 2 below. Due to the sensitive nature of
              pharmaceutical products, general "change of mind" returns are{" "}
              <strong className="text-foreground">not accepted</strong> once an order has been
              delivered, in line with standard pharmacy safety practices. This protects every
              customer from receiving medication that may have been tampered with, exposed to
              improper storage/temperature conditions, or compromised in transit.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">2. Eligible Reasons for Return or Refund</h2>
            <p>We will offer a replacement or full refund only in the following cases:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>You received the wrong medication, strength, or quantity from what you ordered.</li>
              <li>
                The item arrived damaged, expired, or with broken cold-chain packaging (for
                temperature-sensitive medication).
              </li>
              <li>The item is defective or was not as described at the time of purchase.</li>
              <li>Your order was not delivered within the confirmed delivery window and you no longer require it.</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">3. How to Request a Return or Refund</h2>
            <p>
              Contact our support team within the 48-hour return window with your order reference
              number, a description of the issue, and photos of the item and packaging:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                WhatsApp:{" "}
                <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
                  {WHATSAPP_NUMBER}
                </a>
              </li>
              <li>
                Email:{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-primary hover:underline">
                  {SUPPORT_EMAIL}
                </a>
              </li>
            </ul>
            <p className="mt-2">
              Our pharmacist team will review your request within 1–2 business days and confirm
              whether a replacement or refund applies. For safety reasons, medication is not
              accepted back by mail — once your return is approved, we process the resolution
              directly (replacement dispatch or refund) without requiring you to ship the item
              back to us.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">4. Return &amp; Refund Costs</h2>
            <p>
              There is no cost to you for an approved return under Section 2 — replacements are
              redelivered and refunds are issued in full, free of any restocking or return
              shipping fees. Diamond Pharma Care covers all costs for eligible returns.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">5. Refund Method &amp; Timelines</h2>
            <p>Approved refunds are issued back to your original payment method:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong className="text-foreground">Paystack / Flutterwave (card, bank, USSD) payments:</strong>{" "}
                refunded to your original card or bank account within 5–10 business days,
                depending on your bank.
              </li>
              <li>
                <strong className="text-foreground">Bank transfer payments:</strong> refunded to the
                bank account used for payment within 3–7 business days after approval.
              </li>
            </ul>
            <p className="mt-2">All approved refunds are issued in full for the affected item(s).</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">6. Wholesale (B2B) Orders</h2>
            <p>
              Bulk and wholesale orders are subject to the terms agreed upon at the time of quote
              approval. Please contact your account representative directly for any return or
              refund inquiries related to a B2B order.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">7. Contact Us</h2>
            <p>
              Diamond Pharma Care, {STORE_ADDRESS}, Nigeria. If you have any questions about this
              policy, please reach out to us via WhatsApp or email above before placing your order.
            </p>
          </div>
        </div>
      </section>
    </PharmacyLayout>
  );
};

export default ReturnRefundPolicy;
