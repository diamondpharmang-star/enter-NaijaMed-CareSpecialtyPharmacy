import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { PharmacyLayout } from "@/components/pharmacy/PharmacyLayout";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/pharmacy";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;

const STATUS_VARIANT: Record<string, string> = {
  processing: "bg-secondary text-secondary-foreground",
  shipped: "bg-category-rare text-category-rare-foreground",
  delivered: "bg-category-weightloss text-category-weightloss-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

const AccountOrders = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders(data ?? []);
        setIsLoading(false);
      });
  }, [user]);

  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <PharmacyLayout>
      <div className="container py-10">
        <h1 className="mb-8 text-3xl font-bold text-foreground">My Orders</h1>

        {isLoading ? (
          <p className="text-muted-foreground">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-muted-foreground">You haven't placed any orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/order-confirmation?order_id=${order.id}`}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-elegant sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {formatNaira(Number(order.total_amount))}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="capitalize">
                    {order.payment_status}
                  </Badge>
                  <Badge className={STATUS_VARIANT[order.order_status] || ""}>
                    {order.order_status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PharmacyLayout>
  );
};

export default AccountOrders;
