import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, Minus, Plus, ArrowLeft, MessageCircle } from "lucide-react";
import { PharmacyLayout } from "@/components/pharmacy/PharmacyLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatNaira, whatsappQuoteLink, categoryBadgeClass } from "@/lib/pharmacy";
import { useCategories } from "@/hooks/useCategories";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Product = Tables<"products">;

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCart();
  const { profile } = useAuth();
  const { categories, labelFor } = useCategories();

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);
    supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        setProduct(data);
        setIsLoading(false);
      });
  }, [slug]);

  const isB2B = profile?.account_type === "b2b";
  const hasPrice = product?.price !== null && product?.price !== undefined;
  const displayPrice =
    product && hasPrice ? Number(isB2B && product.b2b_price ? product.b2b_price : product.price) : 0;

  const handleAddToCart = () => {
    if (!product || !hasPrice) return;
    addItem(
      {
        product_id: product.id,
        product_name: product.name,
        slug: product.slug,
        unit_price: displayPrice,
        image_url: product.image_url,
        category: product.category,
      },
      quantity
    );
    toast.success(`${product.name} added to cart`);
  };

  if (isLoading) {
    return (
      <PharmacyLayout>
        <div className="container py-24 text-center text-muted-foreground">Loading product...</div>
      </PharmacyLayout>
    );
  }

  if (!product) {
    return (
      <PharmacyLayout>
        <div className="container py-24 text-center">
          <p className="text-muted-foreground">Product not found.</p>
          <Button asChild variant="link">
            <Link to="/shop">Back to shop</Link>
          </Button>
        </div>
      </PharmacyLayout>
    );
  }

  return (
    <PharmacyLayout>
      <div className="container py-10">
        <Link to="/shop" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-xl border border-border bg-muted">
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Badge className={categoryBadgeClass(product.category, categories)}>
              {labelFor(product.category)}
            </Badge>
            <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
            <p className="text-muted-foreground">{product.description}</p>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">
                {hasPrice ? formatNaira(displayPrice) : "Price on request"}
              </span>
              {hasPrice && isB2B && product.b2b_price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatNaira(Number(product.price))}
                </span>
              )}
              {hasPrice && isB2B && product.b2b_price && (
                <Badge variant="secondary">Wholesale price</Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {hasPrice
                ? product.stock_quantity > 0
                  ? `${product.stock_quantity} units in stock`
                  : "Currently out of stock"
                : "Contact us on WhatsApp for availability and pricing."}
            </p>

            {hasPrice ? (
              <div className="mt-2 flex items-center gap-4">
                <div className="flex items-center rounded-md border border-input">
                  <Button variant="ghost" size="icon" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center font-medium">{quantity}</span>
                  <Button variant="ghost" size="icon" onClick={() => setQuantity((q) => q + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity <= 0}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" /> Add to cart
                </Button>
              </div>
            ) : (
              <Button asChild size="lg" variant="secondary" className="mt-2">
                <a href={whatsappQuoteLink(product.name)} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" /> Request price quote on WhatsApp
                </a>
              </Button>
            )}

            <div className="mt-6 rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
              Specialty medication in this category may require pharmacist review before dispatch.
              Our team will contact you if any additional information is needed.
            </div>
          </div>
        </div>
      </div>
    </PharmacyLayout>
  );
};

export default ProductDetail;
