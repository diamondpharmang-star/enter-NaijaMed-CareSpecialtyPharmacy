import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { formatNaira, CATEGORY_LABELS, CATEGORY_BADGE_CLASSES } from "@/lib/pharmacy";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  const handleAddToCart = () => {
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
              crossOrigin="anonymous"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </div>
      </Link>
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <Badge className={CATEGORY_BADGE_CLASSES[product.category]}>
          {CATEGORY_LABELS[product.category]}
        </Badge>
        <Link to={`/product/${product.slug}`}>
          <h3 className="line-clamp-2 font-semibold text-foreground hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        <div className="mt-auto pt-2 text-lg font-bold text-primary">
          {formatNaira(Number(product.price))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          variant="default"
          onClick={handleAddToCart}
          disabled={product.stock_quantity <= 0}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {product.stock_quantity > 0 ? "Add to cart" : "Out of stock"}
        </Button>
      </CardFooter>
    </Card>
  );
}
