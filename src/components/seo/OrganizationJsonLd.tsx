import { useEffect } from "react";
import { buildOrganizationJsonLd } from "@/lib/seo";

/** Sitewide business structured data (JSON-LD), rendered once per page via PharmacyLayout. */
export function OrganizationJsonLd() {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(buildOrganizationJsonLd(window.location.origin));
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}
