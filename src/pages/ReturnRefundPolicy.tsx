import { PharmacyLayout } from "@/components/pharmacy/PharmacyLayout";
import { WHATSAPP_NUMBER, WHATSAPP_LINK } from "@/lib/pharmacy";

const SUPPORT_EMAIL = "care@diamondpharmacare.ng";

const ReturnRefundPolicy = () => {
  return (
    <PharmacyLayout>
      <section className="border-b border-border bg-gradient-subtle">
        <div className="container py-10">
          <h1 className="text-3xl font-bold text-foreground">Return &amp; Refund Policy</h1>
          <p className="mt-2 text-muted-foreground">Last updated: July 2026</p>
        </div>
      </section>

      <section className="container max-w-3xl py-10">
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">1. Non-Returnable Medication</h2>
            <p>
              Due to the sensitive nature of pharmaceutical products, all oncology, rare disease,
              diabetes, and other prescription medication sold by Diamond Pharma Care are{" "}
              <strong className="text-foreground">non-returnable and non-refundable</strong> once
              delivered, in line with standard pharmacy safety practices. This protects every
              customer from receiving medication that may have been tampered with, exposed to
              improper storage/temperature conditions, or compromised in transit.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">2. Exceptions</h2>
            <p>We will offer a replacement or full refund only in the following cases:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>You received the wrong medication, strength, or quantity from what you ordered.</li>
              <li>The item arrived damaged, expired, or with broken cold-chain packaging (for temperature-sensitive medication).</li>
              <li>Your order was not delivered within the confirmed delivery window and you no longer require it.</li>
            </ul>
            <p className="mt-2">
              To qualify, you must contact us within <strong className="text-foreground">48 hours</strong> of
              delivery with your order reference, a description of the issue, and photos of the item
              and packaging.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">3. How to Request a Return or Refund</h2>
            <p>
              Reach out to our support team on WhatsApp or email with your order reference number:
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
              Our pharmacist team will review your request within 1–2 business days and advise on
              next steps, including whether a replacement, refund, or exchange applies.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">4. Refund Timelines</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong className="text-foreground">Paystack payments:</strong> approved refunds are
                processed back to your original card or bank account within 5–10 business days,
                depending on your bank.
              </li>
              <li>
                <strong className="text-foreground">Bank transfer payments:</strong> approved refunds
                are sent back to the bank account used for payment within 3–7 business days after
                approval.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">5. Wholesale (B2B) Orders</h2>
            <p>
              Bulk and wholesale orders are subject to the terms agreed upon at the time of quote
              approval. Please contact your account representative directly for any return or
              refund inquiries related to a B2B order.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">6. Contact Us</h2>
            <p>
              If you have any questions about this policy, please reach out to us via WhatsApp or
              email above before placing your order.
            </p>
          </div>
        </div>
      </section>
    </PharmacyLayout>
  );
};

export default ReturnRefundPolicy;
