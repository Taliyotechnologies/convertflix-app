import { useEffect } from 'react';

export type SEOOptions = {
  title?: string;
  description?: string;
  keywords?: string[];
  path?: string;
  image?: string;
  noindex?: boolean;
};

function upsertMetaByName(name: string, content: string) {
  if (!content) return;
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertMetaByProperty(property: string, content: string) {
  if (!content) return;
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useSEO({ title, description, keywords, path, image, noindex }: SEOOptions) {
  useEffect(() => {
    const defaultTitle = 'ConvertFlix – Compress & Convert Any File Instantly';
    const defaultDesc = 'Free online file compression and conversion tools by Taliyo Technologies.';
    const envSite = (import.meta as any)?.env?.VITE_SITE_URL as string | undefined;
    const base = (envSite ? String(envSite) : (typeof window !== 'undefined' ? window.location.origin : ''))
      .replace(/\/+$/, '');
    const pathStr = path || (typeof window !== 'undefined' ? window.location.pathname : '/');
    const url = base + (pathStr.startsWith('/') ? pathStr : `/${pathStr}`);
    const rawImage = image || '/icon-converter.svg';
    const absoluteImage = rawImage.startsWith('http') ? rawImage : `${base}${rawImage.startsWith('/') ? rawImage : `/${rawImage}`}`;

    if (title) document.title = title;

    upsertMetaByName('description', description || defaultDesc);
    if (keywords && keywords.length) upsertMetaByName('keywords', keywords.join(', '));
    upsertMetaByName('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // OpenGraph
    upsertMetaByProperty('og:title', title || defaultTitle);
    upsertMetaByProperty('og:description', description || defaultDesc);
    upsertMetaByProperty('og:type', 'website');
    upsertMetaByProperty('og:url', url);
    upsertMetaByProperty('og:site_name', 'ConvertFlix by Taliyo Technologies');
    upsertMetaByProperty('og:image', absoluteImage);

    // Twitter
    upsertMetaByName('twitter:card', 'summary_large_image');
    upsertMetaByName('twitter:title', title || defaultTitle);
    upsertMetaByName('twitter:description', description || defaultDesc);
    upsertMetaByName('twitter:image', absoluteImage);

    // Canonical link
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }, [title, description, image, noindex, path, keywords && keywords.join(', ')]);
}
