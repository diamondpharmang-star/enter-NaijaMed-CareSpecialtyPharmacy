import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { PharmacyLayout } from "@/components/pharmacy/PharmacyLayout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { formatNaira } from "@/lib/pharmacy";
import { useCategories } from "@/hooks/useCategories";

const Cart = () => {
  const { items, updateQuantity, removeItem, totalAmount } = useCart();
  const navigate = useNavigate();
  const { labelFor } = useCategories();

  if (items.length === 0) {
    return (
      <PharmacyLayout>
        <div className="container flex flex-col items-center gap-4 py-24 text-center">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Your cart is empty</h1>
          <p className="text-muted-foreground">Browse our catalog to find the medication you need.</p>
          <Button asChild>
            <Link to="/shop">Shop now</Link>
          </Button>
        </div>
      </PharmacyLayout>
    );
  }

  return (
    <PharmacyLayout>
      <div className="container py-10">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Your Cart</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.slug}`}
                    className="font-medium text-foreground hover:text-primary line-clamp-1"
                  >
                    {item.product_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{labelFor(item.category)}</p>
                  <p className="mt-1 font-semibold text-primary">{formatNaira(item.unit_price)}</p>
                </div>
                <div className="flex items-center rounded-md border border-input">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeItem(item.product_id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatNaira(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-bold text-foreground">
              <span>Total</span>
              <span>{formatNaira(totalAmount)}</span>
            </div>
            <Button className="mt-6 w-full" size="lg" onClick={() => navigate("/checkout")}>
              Proceed to checkout <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </PharmacyLayout>
  );
};

export default Cart;
