import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { PharmacyLayout } from "@/components/pharmacy/PharmacyLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setIsSubmitting(false);
      return;
    }

    const userId = data.user?.id;
    const { data: profile } = userId
      ? await supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
      : { data: null };

    if (!profile || profile.role !== "admin") {
      await supabase.auth.signOut();
      toast.error("This login is for administrators only.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    navigate("/admin");
  };

  return (
    <PharmacyLayout>
      <div className="container flex items-center justify-center py-16">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin sign in</h1>
              <p className="text-sm text-muted-foreground">Staff access only.</p>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/" className="font-medium text-primary hover:underline">
              Back to store
            </Link>
          </p>
        </div>
      </div>
    </PharmacyLayout>
  );
};

export default AdminLogin;
