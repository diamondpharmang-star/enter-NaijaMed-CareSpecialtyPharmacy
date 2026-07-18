import { ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PharmacyLayout } from "@/components/pharmacy/PharmacyLayout";
import { useAuth } from "@/contexts/AuthContext";

interface AdminLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** Hide the "Back to Dashboard" link, used on the dashboard landing page itself. */
  isLanding?: boolean;
}

export function AdminLayout({ title, description, children, isLanding }: AdminLayoutProps) {
  const { profile, isLoading } = useAuth();

  if (!isLoading && (!profile || profile.role !== "admin")) {
    return <Navigate to="/admin-login" replace />;
  }

  return (
    <PharmacyLayout>
      <div className="container py-10">
        {!isLanding && (
          <Link
            to="/admin"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        )}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {description && <p className="mt-1 text-muted-foreground">{description}</p>}
        </div>
        {isLoading ? <p className="text-muted-foreground">Loading...</p> : children}
      </div>
    </PharmacyLayout>
  );
}
