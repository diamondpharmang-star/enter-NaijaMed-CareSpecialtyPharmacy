import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Building2 } from "lucide-react";
import { PharmacyLayout } from "@/components/pharmacy/PharmacyLayout";
import { Seo } from "@/components/seo/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const B2BSignup = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    contact_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    license_number: "",
    products_needed: "",
    estimated_quantity: "",
    message: "",
  });

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: form.contact_name,
          phone: form.phone,
          account_type: "b2b",
          business_name: form.business_name,
          business_license_number: form.license_number,
        },
      },
    });

    if (signUpError) {
      toast.error(signUpError.message);
      setIsSubmitting(false);
      return;
    }

    const { error: quoteError } = await supabase.from("b2b_quote_requests").insert({
      user_id: signUpData.user?.id || null,
      business_name: form.business_name,
      contact_name: form.contact_name,
      email: form.email,
      phone: form.phone,
      license_number: form.license_number,
      products_needed: form.products_needed,
      estimated_quantity: form.estimated_quantity,
      message: form.message,
    });

    setIsSubmitting(false);

    if (quoteError) {
      toast.error("Account created, but we couldn't submit your quote request. Please try again from your account.");
      navigate("/");
      return;
    }

    toast.success("Business account created and quote request submitted!");
    navigate("/");
  };

  return (
    <PharmacyLayout>
      <Seo
        title="Wholesale & B2B Registration"
        description="Create a business account and request bulk pricing for your Pharmacy, Clinic, Hospital, or NGO."
        path="/b2b/signup"
      />
      <div className="container py-16">
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-primary">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Wholesale &amp; B2B Registration</h1>
              <p className="text-sm text-muted-foreground">
                Create a business account and request bulk pricing for your pharmacy, clinic, or NGO.
              </p>
            </div>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="business_name">Business name</Label>
                <Input
                  id="business_name"
                  required
                  value={form.business_name}
                  onChange={(e) => updateField("business_name", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="license_number">Pharmacy/business license no.</Label>
                <Input
                  id="license_number"
                  value={form.license_number}
                  onChange={(e) => updateField("license_number", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact_name">Contact person</Label>
                <Input
                  id="contact_name"
                  required
                  value={form.contact_name}
                  onChange={(e) => updateField("contact_name", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  required
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Create password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm_password">Confirm password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  required
                  minLength={6}
                  value={form.confirm_password}
                  onChange={(e) => updateField("confirm_password", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="products_needed">Products / categories needed</Label>
              <Input
                id="products_needed"
                required
                placeholder="e.g. Oncology injectables, weight-loss pens"
                value={form.products_needed}
                onChange={(e) => updateField("products_needed", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estimated_quantity">Estimated monthly quantity</Label>
              <Input
                id="estimated_quantity"
                placeholder="e.g. 200 units/month"
                value={form.estimated_quantity}
                onChange={(e) => updateField("estimated_quantity", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Additional details</Label>
              <Textarea
                id="message"
                rows={4}
                value={form.message}
                onChange={(e) => updateField("message", e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create business account &amp; request quote
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </PharmacyLayout>
  );
};

export default B2BSignup;
