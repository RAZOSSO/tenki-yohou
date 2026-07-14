import type { WeatherResponse } from "./types";

export type FavCity = {
  name: string;
  country: string;
  lat: number;
  lon: number;
};

export type CachedWeather = {
  data: WeatherResponse;
  fetchedAt: number; // Date.now()
};

const FAV_KEY = "tenki:favorites";
const HIST_KEY = "tenki:history";
const CACHE_KEY = "tenki:lastWeather";
const A11Y_KEY = "tenki:a11y";

export type A11yPrefs = {
  largeText: boolean;
  highContrast: boolean;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadFavorites(): FavCity[] {
  return readJson(FAV_KEY, []);
}

export function saveFavorites(list: FavCity[]) {
  writeJson(FAV_KEY, list);
}

export function loadHistory(): string[] {
  return readJson(HIST_KEY, []);
}

/** 先頭に都市名を追加。重複は除去し最大8件 */
export function pushHistory(city: string): string[] {
  const name = city.trim();
  if (!name) return loadHistory();
  const next = [name, ...loadHistory().filter((c) => c.toLowerCase() !== name.toLowerCase())].slice(
    0,
    8
  );
  writeJson(HIST_KEY, next);
  return next;
}

export function loadCache(): CachedWeather | null {
  return readJson<CachedWeather | null>(CACHE_KEY, null);
}

export function saveCache(data: WeatherResponse) {
  writeJson(CACHE_KEY, { data, fetchedAt: Date.now() } satisfies CachedWeather);
}

export function loadA11y(): A11yPrefs {
  return readJson(A11Y_KEY, { largeText: false, highContrast: false });
}

export function saveA11y(prefs: A11yPrefs) {
  writeJson(A11Y_KEY, prefs);
}

export function minutesAgo(fetchedAt: number): number {
  return Math.max(0, Math.floor((Date.now() - fetchedAt) / 60000));
}
