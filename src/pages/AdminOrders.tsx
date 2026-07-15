import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { PharmacyLayout } from "@/components/pharmacy/PharmacyLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/pharmacy";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Order = Tables<"orders">;

const PAYMENT_STATUSES = ["pending", "paid", "failed"] as const;
const ORDER_STATUSES = ["processing", "shipped", "delivered", "cancelled"] as const;

const AdminOrders = () => {
  const { profile, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = () => {
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders(data ?? []);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (profile?.role === "admin") fetchOrders();
  }, [profile]);

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    const { error } = await supabase.from("orders").update(updates).eq("id", id);
    if (error) {
      toast.error("Failed to update order.");
      return;
    }
    toast.success("Order updated.");
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };

  if (!authLoading && profile && profile.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <PharmacyLayout>
      <div className="container py-10">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Admin — Orders</h1>

        {isLoading ? (
          <p className="text-muted-foreground">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.id.slice(0, 8).toUpperCase()}
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("en-NG")}
                      </p>
                    </TableCell>
                    <TableCell>
                      {order.customer_name}
                      <p className="text-xs text-muted-foreground">{order.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {order.payment_method.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatNaira(Number(order.total_amount))}</TableCell>
                    <TableCell>
                      <Select
                        value={order.payment_status}
                        onValueChange={(v) => updateOrder(order.id, { payment_status: v })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.order_status}
                        onValueChange={(v) => updateOrder(order.id, { order_status: v })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PharmacyLayout>
  );
};

export default AdminOrders;
