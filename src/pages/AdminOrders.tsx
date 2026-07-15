import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { PharmacyLayout } from "@/components/pharmacy/PharmacyLayout";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/pharmacy";
import type { Tables as DbTables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Order = DbTables<"orders">;
type MedicationQuoteRequest = DbTables<"medication_quote_requests">;
type Product = DbTables<"products">;

const PAYMENT_STATUSES = ["pending", "paid", "failed"] as const;
const ORDER_STATUSES = ["processing", "shipped", "delivered", "cancelled"] as const;
const QUOTE_STATUSES = ["new", "contacted", "quoted", "closed"] as const;
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

const AdminOrders = () => {
  const { profile, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [quoteRequests, setQuoteRequests] = useState<MedicationQuoteRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase
        .from("medication_quote_requests")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("name", { ascending: true }),
    ]).then(([ordersRes, quotesRes, productsRes]) => {
      setOrders(ordersRes.data ?? []);
      setQuoteRequests(quotesRes.data ?? []);
      setProducts(productsRes.data ?? []);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    if (profile?.role === "admin") fetchData();
  }, [profile]);

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    const { error } = await supabase.from("orders").update(updates).eq("id", id);
    if (error) {
      toast.error("Failed to update order.");
      return;
    }
    toast.success("Order updated.");
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };

  const updateQuoteRequest = async (id: string, updates: Partial<MedicationQuoteRequest>) => {
    const { error } = await supabase.from("medication_quote_requests").update(updates).eq("id", id);
    if (error) {
      toast.error("Failed to update quote request.");
      return;
    }
    toast.success("Quote request updated.");
    setQuoteRequests((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const handleProductImageUploaded = (productId: string, imageUrl: string) => {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, image_url: imageUrl } : p)));
  };

  if (!authLoading && profile && profile.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <PharmacyLayout>
      <div className="container py-10">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Admin Dashboard</h1>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <Tabs defaultValue="orders">
            <TabsList>
              <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
              <TabsTrigger value="quotes">Quote Requests ({quoteRequests.length})</TabsTrigger>
              <TabsTrigger value="products">Product Images ({products.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              {orders.length === 0 ? (
                <p className="mt-6 text-muted-foreground">No orders yet.</p>
              ) : (
                <div className="mt-6 overflow-x-auto rounded-xl border border-border">
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
                      {orders.map((order) => (
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
            </TabsContent>

            <TabsContent value="quotes">
              {quoteRequests.length === 0 ? (
                <p className="mt-6 text-muted-foreground">No quote requests yet.</p>
              ) : (
                <div className="mt-6 overflow-x-auto rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Drug</TableHead>
                        <TableHead>Photo</TableHead>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quoteRequests.map((q) => (
                        <TableRow key={q.id}>
                          <TableCell className="font-medium">
                            {q.drug_name}
                            {q.strength && (
                              <p className="text-xs text-muted-foreground">{q.strength}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            {q.photo_url ? (
                              <a href={q.photo_url} target="_blank" rel="noreferrer">
                                <img
                                  src={q.photo_url}
                                  alt={q.drug_name}
                                  crossOrigin="anonymous"
                                  className="h-12 w-12 rounded-md object-cover"
                                />
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                          </TableCell>
                          <TableCell>{q.whatsapp_number}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(q.created_at).toLocaleDateString("en-NG")}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={q.status}
                              onValueChange={(v) => updateQuoteRequest(q.id, { status: v })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {QUOTE_STATUSES.map((s) => (
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
            </TabsContent>

            <TabsContent value="products">
              <p className="mt-6 mb-4 text-sm text-muted-foreground">
                Upload a photo for each medication one by one. Uploaded images replace the current
                photo immediately on the storefront.
              </p>
              {products.length === 0 ? (
                <p className="text-muted-foreground">No products yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medication</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Photo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {product.category.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <ProductImageUploadCell
                              product={product}
                              onUploaded={handleProductImageUploaded}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PharmacyLayout>
  );
};

export default AdminOrders;
