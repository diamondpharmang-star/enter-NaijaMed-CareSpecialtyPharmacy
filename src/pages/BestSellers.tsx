import { useEffect, useState } from "react";
import { PharmacyLayout } from "@/components/pharmacy/PharmacyLayout";
import { ProductCard } from "@/components/pharmacy/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

const BestSellers = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("is_best_seller", true)
      .eq("is_active", true)
      .order("name", { ascending: true })
      .then(({ data }) => {
        setProducts(data ?? []);
        setIsLoading(false);
      });
  }, []);

  return (
    <PharmacyLayout>
      <section className="border-b border-border bg-gradient-subtle">
        <div className="container py-10">
          <h1 className="text-3xl font-bold text-foreground">Best Sellers</h1>
          <p className="mt-2 text-muted-foreground">
            Our most requested medication, trusted by customers across Nigeria.
          </p>
        </div>
      </section>

      <section className="container py-10">
        {isLoading ? (
          <p className="py-16 text-center text-muted-foreground">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No best sellers yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </PharmacyLayout>
  );
};

export default BestSellers;
