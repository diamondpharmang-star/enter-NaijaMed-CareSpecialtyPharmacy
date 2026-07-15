import { Link } from "react-router-dom";
import { ShieldCheck, Truck, Lock, MapPin, Mail, MessageCircle } from "lucide-react";

const SUPPORT_EMAIL = "care@diamondpharmacare.ng";
const STORE_ADDRESS = "116 Okota Road, Lagos";
const WHATSAPP_NUMBER = "+2347042574473";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, "")}`;

export function SiteFooter() {
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
            Nigeria's trusted source for oncology, rare disease, and weight-loss medication —
            delivered safely nationwide.
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
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/shop?category=oncology" className="hover:text-foreground">Oncology</Link></li>
            <li><Link to="/shop?category=rare_drugs" className="hover:text-foreground">Rare Drugs</Link></li>
            <li><Link to="/shop?category=weight_loss" className="hover:text-foreground">Weight Loss</Link></li>
            <li><Link to="/b2b/signup" className="hover:text-foreground">Wholesale (B2B)</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Account</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/login" className="hover:text-foreground">Sign in</Link></li>
            <li><Link to="/signup" className="hover:text-foreground">Create account</Link></li>
            <li><Link to="/account/orders" className="hover:text-foreground">Track order</Link></li>
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
