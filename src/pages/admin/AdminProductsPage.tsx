import { useEffect, useRef, useState } from "react";
import { Search, Loader2, Upload, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira, slugify, type Category } from "@/lib/pharmacy";
import { useCategories } from "@/hooks/useCategories";
import type { Tables as DbTables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Product = DbTables<"products">;

const PRODUCT_IMAGE_BUCKET = "product-images";
const MAX_IMAGE_SIZE_MB = 10;
const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

function ProductImageUploadCell({
  product,
  onUploaded,
}: {
  product: Product;
  onUploaded: (productId: string, imageUrl: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`Image is too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
      toast.error("Unsupported file type. Please upload a JPG, PNG, WEBP, or GIF image.");
      return;
    }

    setIsUploading(true);
    try {
      const path = `products/${product.id}-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
      const imageUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from("products")
        .update({ image_url: imageUrl })
        .eq("id", product.id);

      if (updateError) throw updateError;

      onUploaded(product.id, imageUrl);
      toast.success(`Image updated for ${product.name}`);
    } catch (err) {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
        {product.image_url && (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="mr-2 h-3.5 w-3.5" />
        )}
        {isUploading ? "Uploading..." : "Upload photo"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

function ProductPriceEditCell({
  product,
  onUpdated,
}: {
  product: Product;
  onUpdated: (productId: string, updates: Partial<Product>) => void;
}) {
  const [price, setPrice] = useState(product.price !== null ? String(product.price) : "");
  const [b2bPrice, setB2bPrice] = useState(product.b2b_price !== null ? String(product.b2b_price) : "");
  const [isSaving, setIsSaving] = useState(false);

  const isDirty =
    price !== (product.price !== null ? String(product.price) : "") ||
    b2bPrice !== (product.b2b_price !== null ? String(product.b2b_price) : "");

  const handleSave = async () => {
    const parsedPrice = price.trim() === "" ? null : Number(price);
    const parsedB2bPrice = b2bPrice.trim() === "" ? null : Number(b2bPrice);

    if (parsedPrice !== null && (Number.isNaN(parsedPrice) || parsedPrice < 0)) {
      toast.error("Enter a valid retail price.");
      return;
    }
    if (parsedB2bPrice !== null && (Number.isNaN(parsedB2bPrice) || parsedB2bPrice < 0)) {
      toast.error("Enter a valid wholesale price.");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from("products")
      .update({ price: parsedPrice, b2b_price: parsedB2bPrice })
      .eq("id", product.id);
    setIsSaving(false);

    if (error) {
      toast.error("Failed to update price.");
      return;
    }

    onUpdated(product.id, { price: parsedPrice, b2b_price: parsedB2bPrice });
    toast.success(`Price updated for ${product.name}`);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="space-y-1">
        <Input
          type="number"
          min="0"
          placeholder="Retail price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-32"
        />
      </div>
      <div className="space-y-1">
        <Input
          type="number"
          min="0"
          placeholder="Wholesale price"
          value={b2bPrice}
          onChange={(e) => setB2bPrice(e.target.value)}
          className="w-32"
        />
      </div>
      <Button variant="outline" size="sm" disabled={!isDirty || isSaving} onClick={handleSave}>
        {isSaving ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="mr-2 h-3.5 w-3.5" />
        )}
        Save
      </Button>
    </div>
  );
}

function ProductBestSellerToggle({
  product,
  onUpdated,
}: {
  product: Product;
  onUpdated: (productId: string, updates: Partial<Product>) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsSaving(true);
    const { error } = await supabase
      .from("products")
      .update({ is_best_seller: checked })
      .eq("id", product.id);
    setIsSaving(false);

    if (error) {
      toast.error("Failed to update best seller status.");
      return;
    }

    onUpdated(product.id, { is_best_seller: checked });
    toast.success(checked ? `${product.name} marked as best seller.` : `${product.name} removed from best sellers.`);
  };

  return <Switch checked={product.is_best_seller} onCheckedChange={handleToggle} disabled={isSaving} />;
}

function ProductNameEditCell({
  product,
  onUpdated,
}: {
  product: Product;
  onUpdated: (productId: string, updates: Partial<Product>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Product name cannot be empty.");
      return;
    }
    if (trimmed === product.name) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from("products")
      .update({ name: trimmed })
      .eq("id", product.id);
    setIsSaving(false);

    if (error) {
      toast.error("Failed to update name.");
      return;
    }

    onUpdated(product.id, { name: trimmed });
    toast.success("Product name updated.");
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(product.name);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium">{product.name}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-56"
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

function DeleteProductButton({
  product,
  onDeleted,
}: {
  product: Product;
  onDeleted: (productId: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    setIsDeleting(false);

    if (error) {
      toast.error("Failed to delete product. It may be referenced by existing orders.");
      return;
    }

    onDeleted(product.id);
    toast.success(`${product.name} deleted.`);
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
          <AlertDialogTitle>Delete {product.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove this medication from the catalog. This action cannot be
            undone.
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

function AddProductDialog({
  categories,
  onCreated,
}: {
  categories: Category[];
  onCreated: (product: Product) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    b2b_price: "",
    stock_quantity: "0",
  });

  useEffect(() => {
    if (categories.length > 0 && !form.category) {
      setForm((prev) => ({ ...prev, category: categories[0].key }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const clearPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: categories[0]?.key ?? "",
      description: "",
      price: "",
      b2b_price: "",
      stock_quantity: "0",
    });
    clearPhoto();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`Image is too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
      toast.error("Unsupported file type. Please upload a JPG, PNG, WEBP, or GIF image.");
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      toast.error("Enter a medication name.");
      return;
    }
    if (!form.category) {
      toast.error("Select a category.");
      return;
    }

    const parsedPrice = form.price.trim() === "" ? null : Number(form.price);
    const parsedB2bPrice = form.b2b_price.trim() === "" ? null : Number(form.b2b_price);
    const parsedStock = Number(form.stock_quantity) || 0;

    if (parsedPrice !== null && (Number.isNaN(parsedPrice) || parsedPrice < 0)) {
      toast.error("Enter a valid retail price.");
      return;
    }
    if (parsedB2bPrice !== null && (Number.isNaN(parsedB2bPrice) || parsedB2bPrice < 0)) {
      toast.error("Enter a valid wholesale price.");
      return;
    }

    setIsSaving(true);

    let image_url: string | null = null;
    if (photoFile) {
      setIsUploading(true);
      const ext = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `products/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(path, photoFile, { contentType: photoFile.type, upsert: false });
      setIsUploading(false);

      if (uploadError) {
        setIsSaving(false);
        toast.error("Failed to upload photo. Please try again.");
        return;
      }

      const { data: publicUrlData } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
      image_url = publicUrlData.publicUrl;
    }

    const baseSlug = slugify(trimmedName);
    const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;

    const { data, error } = await supabase
      .from("products")
      .insert({
        name: trimmedName,
        slug,
        category: form.category,
        description: form.description || null,
        price: parsedPrice,
        b2b_price: parsedB2bPrice,
        stock_quantity: parsedStock,
        image_url,
      })
      .select()
      .single();

    setIsSaving(false);

    if (error || !data) {
      toast.error("Failed to create product.");
      return;
    }

    onCreated(data);
    toast.success(`${trimmedName} added to catalog.`);
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add new medication</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="shrink-0 space-y-1.5">
              <Label className="text-xs">Photo</Label>
              {photoPreview ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                  <img src={photoPreview} alt="Selected medication" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/70 text-background"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-input text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-[10px]">Upload</span>
                </button>
              )}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            <div className="flex-1 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="new_product_name">Medication name</Label>
                <Input
                  id="new_product_name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Keytruda 100mg Injection"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => updateField("category", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.key} value={cat.key}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new_product_description">Description</Label>
            <Textarea
              id="new_product_description"
              rows={2}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Brief description of the medication and its use"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new_product_price" className="text-xs">Retail price (₦)</Label>
              <Input
                id="new_product_price"
                type="number"
                min="0"
                placeholder="Blank = on request"
                value={form.price}
                onChange={(e) => updateField("price", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new_product_b2b_price" className="text-xs">Wholesale price (₦)</Label>
              <Input
                id="new_product_b2b_price"
                type="number"
                min="0"
                value={form.b2b_price}
                onChange={(e) => updateField("b2b_price", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new_product_stock" className="text-xs">Stock qty</Label>
              <Input
                id="new_product_stock"
                type="number"
                min="0"
                value={form.stock_quantity}
                onChange={(e) => updateField("stock_quantity", e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading ? "Uploading photo..." : "Create medication"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductCategorySelect({
  product,
  categories,
  onUpdated,
}: {
  product: Product;
  categories: Category[];
  onUpdated: (productId: string, updates: Partial<Product>) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = async (value: string) => {
    setIsSaving(true);
    const { error } = await supabase.from("products").update({ category: value }).eq("id", product.id);
    setIsSaving(false);

    if (error) {
      toast.error("Failed to update category.");
      return;
    }

    onUpdated(product.id, { category: value });
    toast.success("Category updated.");
  };

  return (
    <Select value={product.category} onValueChange={handleChange} disabled={isSaving}>
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {categories.map((cat) => (
          <SelectItem key={cat.key} value={cat.key}>
            {cat.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const AdminProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { categories } = useCategories();

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true })
      .then(({ data }) => {
        setProducts(data ?? []);
        setIsLoading(false);
      });
  }, []);

  const handleProductImageUploaded = (productId: string, imageUrl: string) => {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, image_url: imageUrl } : p)));
  };

  const handleProductUpdated = (productId: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, ...updates } : p)));
  };

  const handleProductCreated = (product: Product) => {
    setProducts((prev) => [...prev, product].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleProductDeleted = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredProducts = normalizedQuery
    ? products.filter((p) =>
        [p.name, p.description, p.category]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(normalizedQuery))
      )
    : products;

  return (
    <AdminLayout title="Manage Products" description="Add, edit, or remove medications in your catalog.">
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search medications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <AddProductDialog categories={categories} onCreated={handleProductCreated} />
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Leave a price field blank to show "Price on request" on the storefront.
          </p>
          {filteredProducts.length === 0 ? (
            <p className="text-muted-foreground">
              {normalizedQuery ? "No medications match your search." : "No products yet."}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Photo</TableHead>
                    <TableHead>Price (₦)</TableHead>
                    <TableHead>Best Seller</TableHead>
                    <TableHead className="text-right">Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <ProductNameEditCell product={product} onUpdated={handleProductUpdated} />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {product.price !== null ? formatNaira(Number(product.price)) : "Price on request"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <ProductCategorySelect
                          product={product}
                          categories={categories}
                          onUpdated={handleProductUpdated}
                        />
                      </TableCell>
                      <TableCell>
                        <ProductImageUploadCell product={product} onUploaded={handleProductImageUploaded} />
                      </TableCell>
                      <TableCell>
                        <ProductPriceEditCell product={product} onUpdated={handleProductUpdated} />
                      </TableCell>
                      <TableCell>
                        <ProductBestSellerToggle product={product} onUpdated={handleProductUpdated} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DeleteProductButton product={product} onDeleted={handleProductDeleted} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default AdminProductsPage;
