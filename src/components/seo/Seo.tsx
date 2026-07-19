import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE_NAME, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE } from "@/lib/seo";

interface SeoProps {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noindex?: boolean;
  /** One JSON-LD object, or an array of them, to embed as structured data. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function setMetaTag(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLinkTag(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function Seo({ title, description, path, image, noindex, jsonLd }: SeoProps) {
  const location = useLocation();

  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const desc = description || DEFAULT_DESCRIPTION;
    const ogImage = image || DEFAULT_OG_IMAGE;
    const origin = window.location.origin;
    const canonicalUrl = `${origin}${path ?? location.pathname}`;

    document.title = fullTitle;

    setMetaTag("name", "description", desc);
    setMetaTag("name", "robots", noindex ? "noindex,nofollow" : "index,follow");

    setMetaTag("property", "og:title", fullTitle);
    setMetaTag("property", "og:description", desc);
    setMetaTag("property", "og:image", ogImage);
    setMetaTag("property", "og:url", canonicalUrl);
    setMetaTag("property", "og:type", "website");
    setMetaTag("property", "og:site_name", SITE_NAME);

    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", fullTitle);
    setMetaTag("name", "twitter:description", desc);
    setMetaTag("name", "twitter:image", ogImage);

    setLinkTag("canonical", canonicalUrl);

    const scripts: HTMLScriptElement[] = [];
    if (jsonLd) {
      const entries = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      entries.forEach((entry) => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.text = JSON.stringify(entry);
        document.head.appendChild(script);
        scripts.push(script);
      });
    }

    return () => {
      scripts.forEach((script) => script.remove());
    };
  }, [title, description, path, image, noindex, jsonLd, location.pathname]);

  return null;
}
