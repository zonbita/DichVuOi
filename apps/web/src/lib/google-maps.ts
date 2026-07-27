const HCMC = { lat: 10.7769, lng: 106.7009 };

let loadPromise: Promise<void> | null = null;

export function getGoogleMapsApiKey() {
  return (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() || '';
}

export function loadGoogleMaps(apiKey: string) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps chỉ chạy trên trình duyệt'));
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Không tải được Google Maps')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.dataset.googleMaps = 'true';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=vi&region=VN`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Không tải được Google Maps'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function defaultMapCenter() {
  return { ...HCMC };
}

export async function geocodeAddress(address: string) {
  if (!window.google?.maps) return null;
  const geocoder = new google.maps.Geocoder();
  try {
    const { results } = await geocoder.geocode({ address, region: 'VN' });
    return results[0]?.geometry.location ?? null;
  } catch {
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number) {
  if (!window.google?.maps) return '';
  const geocoder = new google.maps.Geocoder();
  try {
    const { results } = await geocoder.geocode({ location: { lat, lng } });
    return results[0]?.formatted_address ?? '';
  } catch {
    return '';
  }
}
