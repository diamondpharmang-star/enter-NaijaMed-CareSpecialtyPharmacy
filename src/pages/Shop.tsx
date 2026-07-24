import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { PharmacyLayout } from "@/components/pharmacy/PharmacyLayout";
import { Seo } from "@/components/seo/Seo";
import { ProductCard } from "@/components/pharmacy/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Product = Tables<"products">;

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { categories } = useCategories();

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    setIsLoading(true);
    let query = supabase.from("products").select("*").eq("is_active", true);
    if (activeCategory !== "all") {
      query = query.eq("category", activeCategory);
    }
    query
      .order("price", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
      setProducts(data ?? []);
      setIsLoading(false);
    });
  }, [activeCategory]);

  const filteredProducts = useMemo(
    () =>
      products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  const updateSearch = (value: string) => {
    setSearch(value);
    if (value) {
      searchParams.set("search", value);
    } else {
      searchParams.delete("search");
    }
    setSearchParams(searchParams, { replace: true });
  };

  const setCategory = (category: string) => {
    if (category === "all") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", category);
    }
    setSearchParams(searchParams);
  };

  const activeCategoryLabel = categories.find((c) => c.key === activeCategory)?.label;
  const pageTitle = activeCategoryLabel
    ? `Shop ${activeCategoryLabel} Medication`
    : "Shop Medication";

  // Product collection signal for Google rich results. Only emitted once
  // products have loaded and the visible list is non-empty, so the empty /
  // loading states never produce broken structured data.
  const itemListLd = useMemo<Record<string, unknown> | undefined>(() => {
    if (filteredProducts.length === 0) return undefined;
    const origin = window.location.origin;
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: pageTitle,
      itemListElement: filteredProducts.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.name,
        url: `${origin}/product/${product.slug}`,
      })),
    };
  }, [filteredProducts, pageTitle]);

  return (
    <PharmacyLayout>
      <Seo
        title={pageTitle}
        description="Browse our specialty catalog of oncology, rare disease, diabetes, and other hard-to-find medication with secure checkout and nationwide delivery in Nigeria."
        path="/shop"
        jsonLd={itemListLd}
      />
      <section className="border-b border-border bg-gradient-subtle">
        <div className="container py-10">
          <h1 className="text-3xl font-bold text-foreground">Shop Medication</h1>
          <p className="mt-2 text-muted-foreground">
            Browse our specialty catalog of oncology, rare disease, diabetes, and other medication.
          </p>
        </div>
      </section>

      <section className="container py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory("all")}
              className={cn(activeCategory === "all" && "shadow-elegant")}
            >
              All Products
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.key}
                variant={activeCategory === cat.key ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(cat.key)}
                className={cn(activeCategory === cat.key && "shadow-elegant")}
              >
                {cat.label}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search medication..."
              value={search}
              onChange={(e) => updateSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="py-16 text-center text-muted-foreground">Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </PharmacyLayout>
  );
};

export default Shop;
