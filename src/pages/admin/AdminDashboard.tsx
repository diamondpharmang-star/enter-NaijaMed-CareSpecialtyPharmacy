import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, MessageSquareText, Pill, Tags, CreditCard, UserCog, ArrowRight, LogOut } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories } from "@/hooks/useCategories";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";

const AdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const { categories } = useCategories();
  const { isAdmin, permissions, isLoading: isLoadingPermissions } = useStaffPermissions();
  const [counts, setCounts] = useState({ orders: 0, quotes: 0, products: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("medication_quote_requests").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }),
    ]).then(([ordersRes, quotesRes, productsRes]) => {
      setCounts({
        orders: ordersRes.count ?? 0,
        quotes: quotesRes.count ?? 0,
        products: productsRes.count ?? 0,
      });
    });
  }, []);

  const cards = [
    {
      to: "/admin/orders",
      icon: Package,
      title: "Orders",
      description: "View and manage customer orders.",
      count: counts.orders,
      visible: permissions.can_view_orders,
    },
    {
      to: "/admin/quotes",
      icon: MessageSquareText,
      title: "Quote Requests",
      description: "Customer inquiries for unlisted medication.",
      count: counts.quotes,
      visible: permissions.can_view_quotes,
    },
    {
      to: "/admin/products",
      icon: Pill,
      title: "Manage Products",
      description: "Add, edit, or remove medications.",
      count: counts.products,
      visible: permissions.can_manage_products,
    },
    {
      to: "/admin/categories",
      icon: Tags,
      title: "Categories",
      description: "Organize the storefront catalog.",
      count: categories.length,
      visible: permissions.can_manage_categories,
    },
    {
      to: "/admin/payment-methods",
      icon: CreditCard,
      title: "Payment Methods",
      description: "Enable or disable checkout payment options.",
      visible: permissions.can_manage_payment_methods,
    },
    {
      to: "/admin/staff",
      icon: UserCog,
      title: "Manage Staff",
      description: "Create staff logins and assign dashboard access.",
      visible: isAdmin,
    },
  ].filter((card) => card.visible);

  return (
    <AdminLayout
      title={`Welcome${profile?.full_name ? `, ${profile.full_name}` : ""}`}
      description="Select a section to manage your store."
      isLanding
    >
      {isLoadingPermissions ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : cards.length === 0 ? (
        <p className="text-muted-foreground">
          You don't have access to any dashboard sections yet. Contact an administrator.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-primary">
                  <card.icon className="h-5 w-5" />
                </span>
                {typeof card.count === "number" && (
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground">
                    {card.count}
                  </span>
                )}
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{card.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10 border-t border-border pt-6">
        <Button variant="outline" onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
