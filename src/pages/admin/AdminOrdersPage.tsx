import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RequirePermission } from "@/components/admin/RequirePermission";
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
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/pharmacy";
import type { Tables as DbTables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Order = DbTables<"orders">;

const PAYMENT_STATUSES = ["pending", "paid", "failed"] as const;
const ORDER_STATUSES = ["processing", "shipped", "delivered", "cancelled"] as const;

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders(data ?? []);
        setIsLoading(false);
      });
  }, []);

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    const { error } = await supabase.from("orders").update(updates).eq("id", id);
    if (error) {
      toast.error("Failed to update order.");
      return;
    }
    toast.success("Order updated.");
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));

    supabase.functions
      .invoke("send-order-notification", { body: { type: "status_update", order_id: id } })
      .catch((e) => console.error("Failed to send status update notification:", e));
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredOrders = normalizedQuery
    ? orders.filter((o) =>
        [o.id, o.customer_name, o.email, o.phone, o.payment_method, o.payment_status, o.order_status]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(normalizedQuery))
      )
    : orders;

  return (
    <AdminLayout title="Orders" description="View and manage customer orders.">
      <RequirePermission permission="can_view_orders">
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          <div className="relative mb-6 w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {filteredOrders.length === 0 ? (
            <p className="text-muted-foreground">
              {normalizedQuery ? "No orders match your search." : "No orders yet."}
            </p>
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
                  {filteredOrders.map((order) => (
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
        </>
      )}
      </RequirePermission>
    </AdminLayout>
  );
};

export default AdminOrdersPage;
