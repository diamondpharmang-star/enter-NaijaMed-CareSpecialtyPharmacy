import { useEffect, useState } from "react";
import { Search } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Tables as DbTables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type MedicationQuoteRequest = DbTables<"medication_quote_requests">;

const QUOTE_STATUSES = ["new", "contacted", "quoted", "closed"] as const;

const AdminQuotesPage = () => {
  const [quoteRequests, setQuoteRequests] = useState<MedicationQuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    supabase
      .from("medication_quote_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setQuoteRequests(data ?? []);
        setIsLoading(false);
      });
  }, []);

  const updateQuoteRequest = async (id: string, updates: Partial<MedicationQuoteRequest>) => {
    const { error } = await supabase.from("medication_quote_requests").update(updates).eq("id", id);
    if (error) {
      toast.error("Failed to update quote request.");
      return;
    }
    toast.success("Quote request updated.");
    setQuoteRequests((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredQuoteRequests = normalizedQuery
    ? quoteRequests.filter((q) =>
        [q.drug_name, q.strength, q.whatsapp_number, q.status]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(normalizedQuery))
      )
    : quoteRequests;

  return (
    <AdminLayout title="Quote Requests" description="Customer inquiries for unlisted medication.">
      <RequirePermission permission="can_view_quotes">
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          <div className="relative mb-6 w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search quote requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {filteredQuoteRequests.length === 0 ? (
            <p className="text-muted-foreground">
              {normalizedQuery ? "No quote requests match your search." : "No quote requests yet."}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
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
                  {filteredQuoteRequests.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium">
                        {q.drug_name}
                        {q.strength && <p className="text-xs text-muted-foreground">{q.strength}</p>}
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
        </>
      )}
      </RequirePermission>
    </AdminLayout>
  );
};

export default AdminQuotesPage;
