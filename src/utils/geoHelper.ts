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
    try {
      // 1. Primary IP API check
      const res = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        const country = (data.country_code || data.country || '').toUpperCase();
        if (country) {
          cachedUserCountry = country;
          try {
            sessionStorage.setItem('user_geo_country', country);
          } catch {}
          return country;
        }
      }
    } catch {
      // Primary API failed or timed out, try fallback
    }

    try {
      // 2. Secondary fallback IP API
      const res2 = await fetch('https://ip-api.com/json/?fields=status,countryCode', {
        signal: AbortSignal.timeout(3000),
      });
      if (res2.ok) {
        const data2 = await res2.json();
        const country2 = (data2.countryCode || '').toUpperCase();
        if (country2) {
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

    // Default fallback if IP check fails or is blocked
    cachedUserCountry = 'NON_US';
    return 'NON_US';
  })();

  return geoCheckPromise;
}

/**
 * Gets the target destination URL based on user location.
 * - If user is from real US IP -> opens the affiliate / linktree link (e.g. https://linktr.ee/w34mt).
 * - If user is from Non-US IP -> opens the simple clean official brand domain (e.g. https://www.walmart.com).
 */
export async function getStoreDestinationUrl(affiliateUrl: string, storeName: string, storeSlug: string): Promise<string> {
  const country = await detectUserCountry();
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
