import { PharmacyLayout } from "@/components/pharmacy/PharmacyLayout";
import { Seo } from "@/components/seo/Seo";
import { ProductCard } from "@/components/pharmacy/ProductCard";
import { DataStateNotice } from "@/components/pharmacy/DataStateNotice";
import { useProducts } from "@/hooks/useProducts";

const BestSellers = () => {
  const { products, isLoading, error, refetch } = useProducts({
    bestSellerOnly: true,
    order: "name",
  });

  return (
    <PharmacyLayout>
      <Seo
        title="Best Selling Medication"
        description="Our most requested oncology, rare disease, and diabetes medication, trusted by customers across Nigeria."
        path="/best-sellers"
      />
      <section className="border-b border-border bg-gradient-subtle">
        <div className="container py-10">
          <h1 className="text-3xl font-bold text-foreground">Best Sellers</h1>
          <p className="mt-2 text-muted-foreground">
            Our most requested medication, trusted by customers across Nigeria.
          </p>
        </div>
      </section>

      <section className="container py-10">
        {isLoading && products.length === 0 ? (
          <DataStateNotice variant="loading" title="Loading best sellers..." />
        ) : error && products.length === 0 ? (
          <DataStateNotice
            variant="error"
            title="We couldn't load the best sellers"
            description={error}
            onRetry={refetch}
            isRetrying={isLoading}
          />
        ) : products.length === 0 ? (
          <DataStateNotice
            variant="empty"
            title="No best sellers yet"
            description="Our pharmacists are still curating this list. Browse the full catalogue in the meantime."
          />
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
