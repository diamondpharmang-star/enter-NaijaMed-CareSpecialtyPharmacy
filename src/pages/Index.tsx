import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShieldCheck, Truck, Lock, Stethoscope, ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PharmacyLayout } from "@/components/pharmacy/PharmacyLayout";
import { ProductCard } from "@/components/pharmacy/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

const CATEGORY_CARDS = [
  {
    key: "oncology",
    title: "Oncology",
    description: "Targeted therapies and chemotherapy medication for cancer care.",
    href: "/shop?category=oncology",
    accent: "bg-category-oncology text-category-oncology-foreground",
  },
  {
    key: "rare_drugs",
    title: "Rare Drugs",
    description: "Hard-to-find treatments for rare and orphan diseases.",
    href: "/shop?category=rare_drugs",
    accent: "bg-category-rare text-category-rare-foreground",
  },
  {
    key: "weight_loss",
    title: "Weight Loss",
    description: "Clinically supported medication for weight management.",
    href: "/shop?category=weight_loss",
    accent: "bg-category-weightloss text-category-weightloss-foreground",
  },
];

const TRUST_POINTS = [
  { icon: ShieldCheck, title: "Verified medication", desc: "Sourced from licensed manufacturers and distributors." },
  { icon: Truck, title: "Nationwide delivery", desc: "Cold-chain shipping to all 36 states + FCT." },
  { icon: Lock, title: "Secure checkout", desc: "Paystack encrypted payments or bank transfer." },
  { icon: Stethoscope, title: "Pharmacist support", desc: "Speak with a licensed pharmacist before you order." },
];

const Index = () => {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .limit(4)
      .then(({ data }) => setFeatured(data ?? []));
  }, []);

  return (
    <PharmacyLayout>
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="container relative z-10 flex flex-col items-start gap-6 py-20 md:py-28">
          <span className="rounded-full bg-primary-foreground/10 px-4 py-1 text-sm font-medium backdrop-blur">
            Trusted specialty pharmacy in Nigeria
          </span>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
            Diamond Pharma Care
          </h1>
          <p className="max-w-xl text-lg text-primary-foreground/85">
            Specialists in oncology, rare disease, and weight-loss medication — delivered safely
            and discreetly across Nigeria, with secure online checkout.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/shop">
                Shop medication <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/b2b/signup">Wholesale &amp; B2B</Link>
            </Button>
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              "url(https://cdn.enter.pro/resources/uid_100178098/hero-pharmacy_a890450d.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </section>

      <section className="container py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Shop by category</h2>
            <p className="mt-1 text-muted-foreground">Curated specialty medication categories</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {CATEGORY_CARDS.map((cat) => (
            <Link
              key={cat.key}
              to={cat.href}
              className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-elegant"
            >
              <span className={`inline-flex rounded-lg px-3 py-1 text-sm font-semibold ${cat.accent}`}>
                {cat.title}
              </span>
              <p className="mt-4 text-sm text-muted-foreground">{cat.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Browse products <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gradient-subtle py-16">
        <div className="container">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Featured medication</h2>
              <p className="mt-1 text-muted-foreground">Popular treatments across our catalog</p>
            </div>
            <Button asChild variant="ghost">
              <Link to="/shop">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-secondary/40 p-10 text-center">
          <MessageCircle className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Can't find your medication?</h2>
          <p className="max-w-lg text-muted-foreground">
            Tell us the drug name and strength, upload a photo if you have one, and we'll send you
            a price quote directly on WhatsApp.
          </p>
          <Button asChild size="lg">
            <Link to="/request-quote">Request a price quote</Link>
          </Button>
        </div>
      </section>

      <section className="container pb-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map((point) => (
            <div key={point.title} className="flex flex-col items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-primary">
                <point.icon className="h-5 w-5" />
              </span>
              <h3 className="font-semibold text-foreground">{point.title}</h3>
              <p className="text-sm text-muted-foreground">{point.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </PharmacyLayout>
  );
};

export default Index;
