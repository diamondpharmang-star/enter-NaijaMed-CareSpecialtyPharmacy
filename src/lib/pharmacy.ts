export function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}

export const WHATSAPP_NUMBER = "+2347042574473";
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, "")}`;

export function whatsappQuoteLink(productName: string): string {
  const message = `Hello Diamond Pharma Care, I'd like a price quote for: ${productName}`;
  return `${WHATSAPP_LINK}?text=${encodeURIComponent(message)}`;
}

export const CATEGORY_LABELS: Record<string, string> = {
  oncology: "Oncology",
  rare_drugs: "Rare Drugs",
  weight_loss: "Weight Loss",
};

export const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  oncology: "bg-category-oncology text-category-oncology-foreground",
  rare_drugs: "bg-category-rare text-category-rare-foreground",
  weight_loss: "bg-category-weightloss text-category-weightloss-foreground",
};

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
