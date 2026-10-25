/**
 * Options of the popular timeline. They mirror the API's allowlists in
 * `backend/src/posts/popular.constants.ts`; a value the API does not know is
 * dropped here so a hand-edited URL falls back to a default instead of a 400.
 */
export const POPULAR_SORTS = ['hot', 'new', 'top', 'rising'] as const;
export type PopularSort = (typeof POPULAR_SORTS)[number];

export const POPULAR_TIME_WINDOWS = ['hour', 'day', 'week', 'month', 'year', 'all'] as const;
export type PopularTimeWindow = (typeof POPULAR_TIME_WINDOWS)[number];

/** The API's default for `top`. */
export const DEFAULT_TIME_WINDOW: PopularTimeWindow = 'day';

export const POPULAR_GEO_COUNTRIES = [
  'US', 'AR', 'AU', 'BR', 'BG', 'CA', 'CL', 'CO', 'HR', 'CZ', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IS', 'IN', 'IE', 'IT', 'JP', 'MY', 'MX', 'NZ', 'PH',
  'PL', 'PT', 'PR', 'RO', 'RS', 'SG', 'ES', 'SE', 'TW', 'TH', 'TR', 'GB',
] as const;

export function isPopularSort(value: string | undefined): value is PopularSort {
  return POPULAR_SORTS.includes(value as PopularSort);
}

export function parseTimeWindow(value: string | null): PopularTimeWindow {
  return POPULAR_TIME_WINDOWS.includes(value as PopularTimeWindow)
    ? (value as PopularTimeWindow)
    : DEFAULT_TIME_WINDOW;
}

export function parseGeo(value: string | null): string | undefined {
  const upper = value?.toUpperCase();
  return POPULAR_GEO_COUNTRIES.find((code) => code === upper);
}

/** `/popular/<sort>?geo=..&t=..`; `t` only matters for `top`, so it is left off otherwise. */
export function popularPath(sort: PopularSort, geo?: string, t?: PopularTimeWindow): string {
  const params = new URLSearchParams();
  if (geo) {
    params.set('geo', geo);
  }
  if (sort === 'top' && t && t !== DEFAULT_TIME_WINDOW) {
    params.set('t', t);
  }
  const query = params.toString();
  return `/popular/${sort}${query ? `?${query}` : ''}`;
}
