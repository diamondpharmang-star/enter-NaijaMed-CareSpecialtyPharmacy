import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, UserCog } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import type { StaffPermissions } from "@/hooks/useStaffPermissions";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type StaffPermissionsRow = Tables<"staff_permissions">;
type ProfileWithPermissionsRow = {
  id: string;
  full_name: string | null;
  email: string;
  staff_permissions: StaffPermissionsRow | StaffPermissionsRow[] | null;
};

interface StaffMember {
  id: string;
  full_name: string | null;
  email: string;
  permissions: StaffPermissions;
}

const PERMISSION_LABELS: { key: keyof StaffPermissions; label: string }[] = [
  { key: "can_view_orders", label: "Orders" },
  { key: "can_view_quotes", label: "Quote Requests" },
  { key: "can_manage_products", label: "Manage Products" },
  { key: "can_manage_categories", label: "Categories" },
  { key: "can_manage_payment_methods", label: "Payment Methods" },
];

const EMPTY_PERMISSIONS: StaffPermissions = {
  can_view_orders: false,
  can_view_quotes: false,
  can_manage_products: false,
  can_manage_categories: false,
  can_manage_payment_methods: false,
};

function AddStaffDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [permissions, setPermissions] = useState<StaffPermissions>(EMPTY_PERMISSIONS);

  const resetForm = () => {
    setForm({ full_name: "", email: "", password: "" });
    setPermissions(EMPTY_PERMISSIONS);
  };

  const updateField = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const togglePermission = (key: keyof StaffPermissions, checked: boolean) =>
    setPermissions((prev) => ({ ...prev, [key]: checked }));

  const handleCreate = async () => {
    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("Please fill in name, email, and password.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsSaving(true);
    const { data, error } = await supabase.functions.invoke("create-staff-user", {
      body: {
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim(),
        permissions,
      },
    });
    setIsSaving(false);

    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Failed to create staff account.");
      return;
    }

    toast.success(`${form.full_name} added as staff.`);
    resetForm();
    setOpen(false);
    onCreated();
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
          <Plus className="mr-2 h-4 w-4" /> Add staff
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add staff member</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="staff_full_name">Full name</Label>
            <Input
              id="staff_full_name"
              value={form.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="staff_email">Email address</Label>
            <Input
              id="staff_email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="staff_password">Password</Label>
            <Input
              id="staff_password"
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Dashboard access</Label>
            <div className="space-y-2 rounded-lg border border-border p-3">
              {PERMISSION_LABELS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={permissions[key]}
                    onCheckedChange={(checked) => togglePermission(key, !!checked)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create staff account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StaffPermissionCheckbox({
  staff,
  permissionKey,
  onUpdated,
}: {
  staff: StaffMember;
  permissionKey: keyof StaffPermissions;
  onUpdated: (staffId: string, updates: Partial<StaffPermissions>) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = async (checked: boolean) => {
    setIsSaving(true);
    const { error } = await supabase
      .from("staff_permissions")
      .update({ [permissionKey]: checked, updated_at: new Date().toISOString() })
      .eq("user_id", staff.id);
    setIsSaving(false);

    if (error) {
      toast.error("Failed to update permission.");
      return;
    }

    onUpdated(staff.id, { [permissionKey]: checked });
  };

  return (
    <Checkbox
      checked={staff.permissions[permissionKey]}
      disabled={isSaving}
      onCheckedChange={(checked) => handleChange(!!checked)}
    />
  );
}

function RemoveStaffButton({ staff, onRemoved }: { staff: StaffMember; onRemoved: (id: string) => void }) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    const { data, error } = await supabase.functions.invoke("delete-staff-user", {
      body: { user_id: staff.id },
    });
    setIsRemoving(false);

    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Failed to remove staff account.");
      return;
    }

    onRemoved(staff.id);
    toast.success(`${staff.full_name || staff.email} removed.`);
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
          <AlertDialogTitle>Remove {staff.full_name || staff.email}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this staff member's login and revoke all dashboard access.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={isRemoving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isRemoving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const AdminStaffPage = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStaff = () => {
    setIsLoading(true);
    supabase
      .from("profiles")
      .select("id, full_name, email, staff_permissions(*)")
      .eq("role", "staff")
      .then(({ data }) => {
        const rows: StaffMember[] = ((data ?? []) as unknown as ProfileWithPermissionsRow[]).map((row) => {
          const permissionsRow = Array.isArray(row.staff_permissions)
            ? row.staff_permissions[0]
            : row.staff_permissions;

          return {
            id: row.id,
            full_name: row.full_name,
            email: row.email,
            permissions: permissionsRow
              ? {
                  can_view_orders: permissionsRow.can_view_orders,
                  can_view_quotes: permissionsRow.can_view_quotes,
                  can_manage_products: permissionsRow.can_manage_products,
                  can_manage_categories: permissionsRow.can_manage_categories,
                  can_manage_payment_methods: permissionsRow.can_manage_payment_methods,
                }
              : EMPTY_PERMISSIONS,
          };
        });
        setStaff(rows);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handlePermissionUpdated = (staffId: string, updates: Partial<StaffPermissions>) => {
    setStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, permissions: { ...s.permissions, ...updates } } : s))
    );
  };

  const handleStaffRemoved = (staffId: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== staffId));
  };

  return (
    <AdminLayout
      title="Manage Staff"
      description="Create staff login credentials and control which dashboard sections they can access."
      requireAdmin
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <AddStaffDialog onCreated={fetchStaff} />
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : staff.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <UserCog className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No staff accounts yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                {PERMISSION_LABELS.map(({ key, label }) => (
                  <TableHead key={key} className="text-center">
                    {label}
                  </TableHead>
                ))}
                <TableHead className="text-right">Remove</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.full_name || "—"}
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </TableCell>
                  {PERMISSION_LABELS.map(({ key }) => (
                    <TableCell key={key} className="text-center">
                      <StaffPermissionCheckbox
                        staff={member}
                        permissionKey={key}
                        onUpdated={handlePermissionUpdated}
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <RemoveStaffButton staff={member} onRemoved={handleStaffRemoved} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminStaffPage;
