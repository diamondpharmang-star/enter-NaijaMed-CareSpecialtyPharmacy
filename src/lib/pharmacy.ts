export function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}

export const WHATSAPP_NUMBER = "08025525894";
// wa.me requires international format (no leading 0); convert Nigerian local format to +234.
const WHATSAPP_INTERNATIONAL_DIGITS = WHATSAPP_NUMBER.replace(/^0/, "234");
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_INTERNATIONAL_DIGITS}`;

export function whatsappQuoteLink(productName: string): string {
  const message = `Hello Diamond Pharma Care, I'd like to buy: ${productName}`;
  return `${WHATSAPP_LINK}?text=${encodeURIComponent(message)}`;
}

export interface Category {
  key: string;
  label: string;
  sort_order: number;
}

// Cycled color classes for category badges, keyed by position so any
// admin-added category still gets a themed badge.
const CATEGORY_BADGE_PALETTE = [
  "bg-category-oncology text-category-oncology-foreground",
  "bg-category-rare text-category-rare-foreground",
  "bg-category-weightloss text-category-weightloss-foreground",
  "bg-secondary text-secondary-foreground",
];

export function categoryBadgeClass(key: string, categories: Category[]): string {
  const index = categories.findIndex((c) => c.key === key);
  if (index === -1) return CATEGORY_BADGE_PALETTE[CATEGORY_BADGE_PALETTE.length - 1];
  return CATEGORY_BADGE_PALETTE[index % CATEGORY_BADGE_PALETTE.length];
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

