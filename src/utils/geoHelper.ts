// Geo-location IP helper to check if user is visiting from real US IP
let cachedUserCountry: string | null = null;
let geoCheckPromise: Promise<string> | null = null;

export async function detectUserCountry(): Promise<string> {
  if (cachedUserCountry) return cachedUserCountry;

  // Check sessionStorage first
  try {
    const saved = sessionStorage.getItem('user_geo_country');
    if (saved) {
      cachedUserCountry = saved;
      return saved;
    }
  } catch {
    // Ignore storage error
  }

  if (geoCheckPromise) return geoCheckPromise;

  geoCheckPromise = (async () => {
    // 1. Cloudflare trace (Fastest, HTTPS, CORS-friendly, no rate limits)
    try {
      const res = await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) {
        const text = await res.text();
        const match = text.match(/^loc=(.+)$/m);
        if (match && match[1]) {
          const country = match[1].trim().toUpperCase();
          cachedUserCountry = country;
          try {
            sessionStorage.setItem('user_geo_country', country);
          } catch {}
          return country;
        }
      }
    } catch {
      // Cloudflare trace failed, try fallback
    }

    // 2. IPWHOIS API (HTTPS, free, CORS-friendly)
    try {
      const res2 = await fetch('https://ipwho.is/', {
        signal: AbortSignal.timeout(2500),
      });
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2 && data2.country_code) {
          const country2 = String(data2.country_code).toUpperCase();
          cachedUserCountry = country2;
          try {
            sessionStorage.setItem('user_geo_country', country2);
          } catch {}
          return country2;
        }
      }
    } catch {
      // Fallback failed
    }

    // 3. IPAPI fallback
    try {
      const res3 = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(2500),
      });
      if (res3.ok) {
        const data3 = await res3.json();
        const country3 = (data3.country_code || data3.country || '').toUpperCase();
        if (country3) {
          cachedUserCountry = country3;
          try {
            sessionStorage.setItem('user_geo_country', country3);
          } catch {}
          return country3;
        }
      }
    } catch {
      // Fallback failed
    }

    // Default fallback if IP check fails or is blocked
    cachedUserCountry = 'US';
    return 'US';
  })();

  return geoCheckPromise;
}

/**
 * Gets the current cached user country synchronously if available
 */
export function getCachedUserCountry(): string {
  if (cachedUserCountry) return cachedUserCountry;
  try {
    const saved = sessionStorage.getItem('user_geo_country');
    if (saved) {
      cachedUserCountry = saved;
      return saved;
    }
  } catch {}
  return 'US'; // Default to US if not yet resolved
}

/**
 * Synchronous URL calculation so window.open can run directly in click handler
 * - If user is from real US IP -> opens the affiliate / linktree link (e.g. https://linktr.ee/w34mt).
 * - If user is from Non-US IP -> opens the simple clean official brand domain (e.g. https://www.walmart.com).
 */
export function getStoreDestinationUrlSync(affiliateUrl: string, storeName: string, storeSlug: string): string {
  const country = getCachedUserCountry();
  const isUS = country === 'US';

  if (isUS) {
    // Real US IP -> open affiliate link
    return affiliateUrl;
  } else {
    // Non-US IP -> open simple clean brand domain
    const nameLower = storeName.toLowerCase();
    const slugLower = storeSlug.toLowerCase();

    if (slugLower.includes('walmart') || nameLower.includes('walmart')) {
      return 'https://www.walmart.com';
    }
    if (slugLower.includes('nordstrom') || nameLower.includes('nordstrom')) {
      return 'https://www.nordstrom.com';
    }
    if (slugLower.includes('zara') || nameLower.includes('zara')) {
      return 'https://www.zara.com';
    }
    if (slugLower.includes('muji') || nameLower.includes('muji')) {
      return 'https://www.muji.com';
    }
    if (slugLower.includes('mango') || nameLower.includes('mango')) {
      return 'https://shop.mango.com';
    }

    // Generic fallback: if affiliateUrl contains linktree or params, return clean brand domain
    try {
      if (affiliateUrl.includes('linktr.ee')) {
        return `https://www.${nameLower.replace(/[^a-z0-9]/g, '')}.com`;
      }
      const url = new URL(affiliateUrl);
      return `${url.protocol}//${url.hostname}`;
    } catch {
      return `https://www.${nameLower.replace(/[^a-z0-9]/g, '')}.com`;
    }
  }
}
