import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShieldCheck, Truck, Lock, Stethoscope, ArrowRight, MessageCircle, Camera, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PharmacyLayout } from "@/components/pharmacy/PharmacyLayout";
import { ProductCard } from "@/components/pharmacy/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { WHATSAPP_LINK, categoryBadgeClass } from "@/lib/pharmacy";
import { useCategories } from "@/hooks/useCategories";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  oncology: "Targeted therapies and chemotherapy medication for cancer care.",
  rare_drugs: "Hard-to-find treatments for rare and orphan diseases.",
  diabetes: "Clinically supported medication for diabetes and metabolic health.",
  others: "Additional specialty medication not covered by our main categories.",
};

const TRUST_POINTS = [
  { icon: ShieldCheck, title: "Verified medication", desc: "Sourced from licensed manufacturers and distributors." },
  { icon: Truck, title: "Nationwide delivery", desc: "Cold-chain shipping to all 36 states + FCT." },
  { icon: Lock, title: "Secure checkout", desc: "Paystack encrypted payments or bank transfer." },
  { icon: Stethoscope, title: "Pharmacist support", desc: "Speak with a licensed pharmacist before you order." },
];

const QUOTE_STEPS = [
  { icon: Stethoscope, text: "Tell us the drug & strength" },
  { icon: Camera, text: "Add a photo (optional)" },
  { icon: Send, text: "Get a reply on WhatsApp" },
];

const Index = () => {
  const [featured, setFeatured] = useState<Product[]>([]);
  const { categories } = useCategories();

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
            Specialists in oncology, rare disease, and diabetes medication — delivered safely
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
          {categories.map((cat) => (
            <Link
              key={cat.key}
              to={`/shop?category=${cat.key}`}
              className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-elegant"
            >
              <span className={`inline-flex rounded-lg px-3 py-1 text-sm font-semibold ${categoryBadgeClass(cat.key, categories)}`}>
                {cat.label}
              </span>
              <p className="mt-4 text-sm text-muted-foreground">
                {CATEGORY_DESCRIPTIONS[cat.key] ?? "Specialty medication available in this category."}
              </p>
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-hero text-primary-foreground shadow-elegant">
          <div className="grid grid-cols-1 items-center gap-8 p-8 md:grid-cols-2 md:p-12">
            <div className="flex flex-col items-start gap-5">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1 text-sm font-medium backdrop-blur">
                <MessageCircle className="h-3.5 w-3.5" /> Personalized sourcing service
              </span>
              <h2 className="text-2xl font-bold leading-tight md:text-3xl">
                Can't find your medication?
              </h2>
              <p className="max-w-md text-primary-foreground/85">
                Tell us the drug name and strength — with a photo if you have one — and our
                pharmacist team will reply on WhatsApp with pricing and availability.
              </p>

              <ul className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
                {QUOTE_STEPS.map((step) => (
                  <li key={step.text} className="flex items-center gap-2 text-sm text-primary-foreground/90">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/10">
                      <step.icon className="h-3.5 w-3.5" />
                    </span>
                    {step.text}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button asChild size="lg" variant="secondary">
                  <Link to="/request-quote">
                    Request a price quote <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="icon"
                  variant="outline"
                  className="h-11 w-11 rounded-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
                    <MessageCircle className="h-5 w-5" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="relative hidden md:block">
              <div className="absolute -inset-6 rounded-3xl bg-primary-foreground/10 blur-2xl" />
              <img
                src="https://cdn.enter.pro/resources/uid_100178098/pharmacist-support_8757b2a0.png"
                alt="Pharmacist ready to help on WhatsApp"
                crossOrigin="anonymous"
                className="relative mx-auto h-72 w-full max-w-sm rounded-2xl object-cover shadow-glow"
              />
            </div>
          </div>
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
