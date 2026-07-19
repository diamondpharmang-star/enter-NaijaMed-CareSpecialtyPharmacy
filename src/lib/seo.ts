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

export interface ProductJsonLdInput {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  categoryLabel: string;
  price: number | null;
  stockQuantity: number;
  origin: string;
}

/**
 * Builds Google-recommended Product structured data (JSON-LD) for a product page.
 * Includes brand, seller, and offer availability/condition so eligible products can
 * show price and stock status directly in Google Search results.
 */
export function buildProductJsonLd(product: ProductJsonLdInput) {
  const hasPrice = product.price !== null;
  const productUrl = `${product.origin}/product/${product.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} — available at ${SITE_NAME}.`,
    image: product.image_url ? [product.image_url] : [DEFAULT_OG_IMAGE],
    sku: product.id,
    productID: product.id,
    category: product.categoryLabel,
    url: productUrl,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    ...(hasPrice
      ? {
          offers: {
            "@type": "Offer",
            url: productUrl,
            priceCurrency: "NGN",
            price: product.price,
            itemCondition: "https://schema.org/NewCondition",
            availability:
              product.stockQuantity > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            seller: {
              "@type": "Organization",
              name: SITE_NAME,
            },
          },
        }
      : {}),
  };
}
