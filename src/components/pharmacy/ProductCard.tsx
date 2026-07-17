import { Link } from "react-router-dom";
import { ShoppingCart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { formatNaira, whatsappQuoteLink, categoryBadgeClass } from "@/lib/pharmacy";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { categories, labelFor } = useCategories();
  const hasPrice = product.price !== null;

  const handleAddToCart = () => {
    if (product.price === null) return;
    addItem({
      product_id: product.id,
      product_name: product.name,
      slug: product.slug,
      unit_price: Number(product.price),
      image_url: product.image_url,
      category: product.category,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Card className="group flex flex-col overflow-hidden transition-shadow hover:shadow-elegant">
      <Link to={`/product/${product.slug}`} className="block">
        <div className="aspect-square w-full overflow-hidden bg-muted">
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </div>
      </Link>
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <Badge className={categoryBadgeClass(product.category, categories)}>
          {labelFor(product.category)}
        </Badge>
        <Link to={`/product/${product.slug}`}>
          <h3 className="line-clamp-2 font-semibold text-foreground hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        <div className="mt-auto pt-2 text-lg font-bold text-primary">
          {hasPrice ? formatNaira(Number(product.price)) : "Price on request"}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 p-4 pt-0">
        {hasPrice ? (
          <>
            <Button
              className="w-full"
              variant="default"
              onClick={handleAddToCart}
              disabled={product.stock_quantity <= 0}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {product.stock_quantity > 0 ? "Add to cart" : "Out of stock"}
            </Button>
            <Button asChild className="w-full" variant="secondary">
              <a href={whatsappQuoteLink(product.name)} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> Order on WhatsApp
              </a>
            </Button>
          </>
        ) : (
          <Button asChild className="w-full" variant="secondary">
            <a href={whatsappQuoteLink(product.name)} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" /> Order on WhatsApp
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
