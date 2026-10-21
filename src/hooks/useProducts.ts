import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products">;

type ProductOrder = "price" | "name";

interface UseProductsOptions {
  /** Category key to filter by. "all" or undefined loads every category. */
  category?: string;
  bestSellerOnly?: boolean;
  limit?: number;
  order?: ProductOrder;
}

const RETRY_DELAY_MS = 1200;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Single source of truth for storefront product fetching.
 *
 * Unlike the previous inline queries, a failed request is surfaced through
 * `error` instead of being rendered as an empty catalogue, already loaded
 * products are kept on screen, and one automatic retry absorbs a cold start.
 */
export function useProducts({
  category,
  bestSellerOnly = false,
  limit,
  order = "price",
}: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchProducts = useCallback(async () => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;

    setIsLoading(true);
    setError(null);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      let filters = supabase.from("products").select("*").eq("is_active", true);

      if (bestSellerOnly) {
        filters = filters.eq("is_best_seller", true);
      }
      if (category && category !== "all") {
        filters = filters.eq("category", category);
      }

      const ordered =
        order === "name"
          ? filters.order("name", { ascending: true })
          : filters
              .order("price", { ascending: true, nullsFirst: false })
              .order("created_at", { ascending: false });

      const { data, error: queryError } = limit
        ? await ordered.limit(limit)
        : await ordered;

      // A newer request started while this one was in flight.
      if (requestId.current !== currentRequest) return;

      if (!queryError) {
        setProducts(data ?? []);
        setError(null);
        setIsLoading(false);
        return;
      }

      if (attempt === 0) {
        await sleep(RETRY_DELAY_MS);
        if (requestId.current !== currentRequest) return;
      }
    }

    setError("The medication database didn't respond. Check your connection and try again.");
    setIsLoading(false);
  }, [bestSellerOnly, category, limit, order]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refetch = useCallback(() => {
    void fetchProducts();
  }, [fetchProducts]);

  return { products, isLoading, error, refetch };
}
