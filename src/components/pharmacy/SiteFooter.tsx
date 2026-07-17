import { Link } from "react-router-dom";
import { ShieldCheck, Truck, Lock, MapPin, Mail, MessageCircle, Clock, Facebook, Instagram, Twitter } from "lucide-react";
import { WHATSAPP_NUMBER, WHATSAPP_LINK } from "@/lib/pharmacy";
import { useCategories } from "@/hooks/useCategories";

const SUPPORT_EMAIL = "care@diamondpharmacare.ng";
const STORE_ADDRESS = "116 Okota Road, Lagos";

// Links to be provided later — icons render disabled until real URLs are set.
const SOCIAL_LINKS = [
  { name: "Facebook", icon: Facebook, href: "" },
  { name: "Instagram", icon: Instagram, href: "" },
  { name: "Twitter", icon: Twitter, href: "" },
  { name: "TikTok", icon: TikTokIcon, href: "" },
];

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82a4.28 4.28 0 0 1-3.11-1.37V15.4a4.6 4.6 0 1 1-3.96-4.56v2.34a2.28 2.28 0 1 0 1.6 2.18V2h2.36a4.28 4.28 0 0 0 3.11 3.63v2.19a6.6 6.6 0 0 1-2.36-.46V5.82Z" />
    </svg>
  );
}

export function SiteFooter() {
  const { categories } = useCategories();

  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="container grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="text-base font-bold text-foreground">Diamond Pharma Care</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Nigeria's trusted source for oncology, rare disease, diabetes, and other specialty
            medication — delivered safely nationwide.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Mail className="h-4 w-4 text-accent" /> {SUPPORT_EMAIL}
          </a>
          <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {STORE_ADDRESS}
          </div>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="h-4 w-4 text-accent" /> WhatsApp: {WHATSAPP_NUMBER}
          </a>
          <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>
              Operating hours: 8am – 10pm
              <br />
              Monday – Sunday
            </span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                href={social.href || undefined}
                target="_blank"
                rel="noreferrer"
                aria-label={social.name}
                aria-disabled={!social.href}
                onClick={(e) => {
                  if (!social.href) e.preventDefault();
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors ${
                  social.href ? "hover:bg-primary hover:text-primary-foreground" : "cursor-not-allowed opacity-50"
                }`}
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {categories.map((cat) => (
              <li key={cat.key}>
                <Link to={`/shop?category=${cat.key}`} className="hover:text-foreground">
                  {cat.label}
                </Link>
              </li>
            ))}
            <li><Link to="/best-sellers" className="hover:text-foreground">Best Sellers</Link></li>
            <li><Link to="/request-quote" className="hover:text-foreground">Request unlisted medication</Link></li>
            <li><Link to="/b2b/signup" className="hover:text-foreground">Wholesale (B2B)</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Account</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/login" className="hover:text-foreground">Sign in</Link></li>
            <li><Link to="/signup" className="hover:text-foreground">Create account</Link></li>
            <li><Link to="/account/orders" className="hover:text-foreground">Track order</Link></li>
            <li><Link to="/return-refund-policy" className="hover:text-foreground">Return &amp; Refund Policy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Why trust us</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-accent" /> Secure Paystack checkout</li>
            <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-accent" /> Nationwide delivery</li>
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-accent" /> Pharmacist support on WhatsApp</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Diamond Pharma Care. All rights reserved.
      </div>
    </footer>
  );
}
