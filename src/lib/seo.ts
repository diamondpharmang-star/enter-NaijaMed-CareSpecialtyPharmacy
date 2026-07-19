import { WHATSAPP_NUMBER } from "@/lib/pharmacy";

export const SITE_NAME = "Diamond Pharma Care";
export const DEFAULT_TITLE = `${SITE_NAME} | Oncology, Rare Disease & Diabetes Medication in Nigeria`;
export const DEFAULT_DESCRIPTION =
  "Diamond Pharma Care is Nigeria's trusted specialty pharmacy for oncology, rare disease, diabetes, and other hard-to-find medication — delivered safely nationwide with secure online checkout.";
export const DEFAULT_OG_IMAGE = "https://cdn.enter.pro/resources/uid_100178098/hero-pharmacy_a890450d.png";
export const STORE_ADDRESS = "116 Okota Road, Lagos";
export const SUPPORT_EMAIL = "care@diamondpharmacare.ng";

export function buildOrganizationJsonLd(origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: origin,
    image: DEFAULT_OG_IMAGE,
    telephone: WHATSAPP_NUMBER,
    email: SUPPORT_EMAIL,
    address: {
      "@type": "PostalAddress",
      streetAddress: STORE_ADDRESS,
      addressCountry: "NG",
    },
  };
}
