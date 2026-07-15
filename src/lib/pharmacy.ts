export function formatNaira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
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
