import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/lib/pharmacy";

const RETRY_DELAY_MS = 1200;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const { data, error: queryError } = await supabase
        .from("categories")
        .select("key, label, sort_order")
        .order("sort_order", { ascending: true });

      if (!queryError) {
        setCategories(data ?? []);
        setError(null);
        setIsLoading(false);
        return;
      }

      if (attempt === 0) await sleep(RETRY_DELAY_MS);
    }

    // Keep any categories already loaded so navigation does not empty out.
    setError("The category list didn't respond.");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const labelFor = (key: string) => categories.find((c) => c.key === key)?.label ?? key;

  return { categories, isLoading, error, labelFor, refetch };
}
