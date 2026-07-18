import { useState } from "react";
import { Loader2, Check, Pencil, Plus, Trash2, X } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { slugify, type Category } from "@/lib/pharmacy";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "sonner";

function AddCategoryForm({ onCreated }: { onCreated: (category: Category) => void }) {
  const [label, setLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    const trimmed = label.trim();
    if (!trimmed) {
      toast.error("Enter a category name.");
      return;
    }

    const key = slugify(trimmed).replace(/-/g, "_");
    if (!key) {
      toast.error("Enter a valid category name.");
      return;
    }

    setIsSaving(true);
    const { data: maxRow } = await supabase
      .from("categories")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextSortOrder = (maxRow?.sort_order ?? 0) + 1;

    const { data, error } = await supabase
      .from("categories")
      .insert({ key, label: trimmed, sort_order: nextSortOrder })
      .select()
      .single();
    setIsSaving(false);

    if (error || !data) {
      toast.error(
        error?.code === "23505" ? "A category with this name already exists." : "Failed to add category."
      );
      return;
    }

    onCreated(data);
    toast.success(`${trimmed} category added.`);
    setLabel("");
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="New category name"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="w-48"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
        }}
      />
      <Button variant="outline" size="sm" disabled={isSaving} onClick={handleAdd}>
        {isSaving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-2 h-3.5 w-3.5" />}
        Add category
      </Button>
    </div>
  );
}

function CategoryLabelEditCell({
  category,
  onUpdated,
}: {
  category: Category;
  onUpdated: (key: string, updates: Partial<Category>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(category.label);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = label.trim();
    if (!trimmed) {
      toast.error("Category name cannot be empty.");
      return;
    }
    if (trimmed === category.label) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.from("categories").update({ label: trimmed }).eq("key", category.key);
    setIsSaving(false);

    if (error) {
      toast.error("Failed to update category.");
      return;
    }

    onUpdated(category.key, { label: trimmed });
    toast.success("Category updated.");
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLabel(category.label);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium">{category.label}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="w-40"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") handleCancel();
        }}
      />
      <Button variant="outline" size="icon" className="h-9 w-9" disabled={isSaving} onClick={handleSave}>
        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-9 w-9" disabled={isSaving} onClick={handleCancel}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function DeleteCategoryButton({
  category,
  onDeleted,
}: {
  category: Category;
  onDeleted: (key: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const { error } = await supabase.from("categories").delete().eq("key", category.key);
    setIsDeleting(false);

    if (error) {
      toast.error("Failed to delete category.");
      return;
    }

    onDeleted(category.key);
    toast.success(`${category.label} category deleted. Its products moved to "Others".`);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {category.label}?</AlertDialogTitle>
          <AlertDialogDescription>
            Any medications currently in this category will be automatically moved to "Others" (if
            it exists) or unassigned. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const AdminCategoriesPage = () => {
  const { categories, isLoading, refetch } = useCategories();

  const handleCategoryCreated = () => refetch();
  const handleCategoryUpdated = () => refetch();
  const handleCategoryDeleted = () => refetch();

  return (
    <AdminLayout title="Categories" description="Add, rename, or remove drug categories shown across the storefront.">
      <RequirePermission permission="can_manage_categories">
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <AddCategoryForm onCreated={handleCategoryCreated} />
          </div>
          {categories.length === 0 ? (
            <p className="text-muted-foreground">No categories yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.key}>
                      <TableCell>
                        <CategoryLabelEditCell category={category} onUpdated={handleCategoryUpdated} />
                      </TableCell>
                      <TableCell className="text-right">
                        {category.key === "others" ? (
                          <span className="text-xs text-muted-foreground">Protected</span>
                        ) : (
                          <DeleteCategoryButton category={category} onDeleted={handleCategoryDeleted} />
                        )}
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

export default AdminCategoriesPage;
