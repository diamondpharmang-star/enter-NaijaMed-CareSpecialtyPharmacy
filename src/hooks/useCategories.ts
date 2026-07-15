import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/lib/pharmacy";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(() => {
    return supabase
      .from("categories")
      .select("key, label, sort_order")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setCategories(data ?? []);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const labelFor = (key: string) => categories.find((c) => c.key === key)?.label ?? key;

  return { categories, isLoading, labelFor, refetch };
}
