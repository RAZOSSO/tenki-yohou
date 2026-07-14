"use client";

import { useEffect, useState } from "react";
import Calendar from "@/components/Calendar";
import WeatherIcon from "@/components/WeatherIcon";
import { buildAdvice } from "@/lib/advice";
import {
  loadA11y,
  loadCache,
  loadFavorites,
  loadHistory,
  minutesAgo,
  pushHistory,
  saveA11y,
  saveCache,
  saveFavorites,
  type A11yPrefs,
  type FavCity,
} from "@/lib/storage";
import type { WeatherResponse } from "@/lib/types";

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const wd = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
  return `${m}月${d}日 (${wd})`;
}

function formatHour(dt: number): string {
  const d = new Date(dt * 1000);
  return `${String(d.getHours()).padStart(2, "0")}:00`;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [stale, setStale] = useState(false);
  const [favorites, setFavorites] = useState<FavCity[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [a11y, setA11y] = useState<A11yPrefs>({
    largeText: false,
    highContrast: false,
  });

  useEffect(() => {
    setFavorites(loadFavorites());
    setHistory(loadHistory());
    const prefs = loadA11y();
    setA11y(prefs);
    applyA11y(prefs);

    const cached = loadCache();
    if (cached) {
      setData(cached.data);
      setFetchedAt(cached.fetchedAt);
      setSelectedDate(cached.data.daily[0]?.date ?? null);
    }
    load(`/api/weather?city=${encodeURIComponent("Tokyo")}`, "Tokyo");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyA11y(prefs: A11yPrefs) {
    const root = document.documentElement;
    root.classList.toggle("large-text", prefs.largeText);
    root.classList.toggle("high-contrast", prefs.highContrast);
  }

  function toggleA11y(key: keyof A11yPrefs) {
    const next = { ...a11y, [key]: !a11y[key] };
    setA11y(next);
    saveA11y(next);
    applyA11y(next);
  }

  async function load(url: string, historyCity?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "取得に失敗しました。");
      }
      const weather = json as WeatherResponse;
      const now = Date.now();
      setData(weather);
      setFetchedAt(now);
      setStale(false);
      setSelectedDate(weather.daily[0]?.date ?? null);
      saveCache(weather);
      if (historyCity) {
        setHistory(pushHistory(historyCity));
      } else if (weather.location.name) {
        setHistory(pushHistory(weather.location.name));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "エラーが発生しました。";
      setError(msg);
      const cached = loadCache();
      if (cached) {
        setData(cached.data);
        setFetchedAt(cached.fetchedAt);
        setStale(true);
        setSelectedDate(cached.data.daily[0]?.date ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  function searchCity(e?: React.FormEvent) {
    e?.preventDefault();
    const city = query.trim();
    if (!city) return;
    load(`/api/weather?city=${encodeURIComponent(city)}`, city);
  }

  function searchFromHistory(city: string) {
    setQuery(city);
    load(`/api/weather?city=${encodeURIComponent(city)}`, city);
  }

  function loadFavorite(fav: FavCity) {
    setQuery(fav.name);
    load(`/api/weather?lat=${fav.lat}&lon=${fav.lon}`, fav.name);
  }

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setError("この端末では現在地を取得できません。");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        load(
          `/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
        );
      },
      () => {
        setLoading(false);
        setError("位置情報の取得が許可されませんでした。");
        const cached = loadCache();
        if (cached) {
          setData(cached.data);
          setFetchedAt(cached.fetchedAt);
          setStale(true);
        }
      }
    );
  }

  function isFavorite(weather: WeatherResponse): boolean {
    return favorites.some(
      (f) =>
        Math.abs(f.lat - weather.location.lat) < 0.01 &&
        Math.abs(f.lon - weather.location.lon) < 0.01
    );
  }

  function toggleFavorite() {
    if (!data) return;
    const loc = data.location;
    const exists = isFavorite(data);
    const next = exists
      ? favorites.filter(
          (f) =>
            !(
              Math.abs(f.lat - loc.lat) < 0.01 &&
              Math.abs(f.lon - loc.lon) < 0.01
            )
        )
      : [
          ...favorites,
          {
            name: loc.name,
            country: loc.country,
            lat: loc.lat,
            lon: loc.lon,
          },
        ];
    setFavorites(next);
    saveFavorites(next);
  }

  function removeFavorite(fav: FavCity) {
    const next = favorites.filter(
      (f) => !(f.lat === fav.lat && f.lon === fav.lon)
    );
    setFavorites(next);
    saveFavorites(next);
  }

  const selectedDay =
    data?.daily.find((d) => d.date === selectedDate) ?? data?.daily[0] ?? null;
  const advice = data
    ? buildAdvice(data.current, selectedDay ?? data.daily[0])
    : [];

  return (
    <main className="page">
      <div className="container">
        <header className="hero">
          <div className="a11y-bar" role="group" aria-label="表示設定">
            <button
              type="button"
              className={`btn a11y ${a11y.largeText ? "on" : ""}`}
              onClick={() => toggleA11y("largeText")}
              aria-pressed={a11y.largeText}
            >
              文字を大きく
            </button>
            <button
              type="button"
              className={`btn a11y ${a11y.highContrast ? "on" : ""}`}
              onClick={() => toggleA11y("highContrast")}
              aria-pressed={a11y.highContrast}
            >
              ハイコントラスト
            </button>
          </div>
          <h1>天気予報</h1>
          <p className="subtitle">
            OpenWeatherMap 連携 / 週間予報 &amp; カレンダー
          </p>
        </header>

        <form className="search" onSubmit={searchCity}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="都市名を入力（例: Osaka, London, 札幌）"
            aria-label="都市名"
          />
          <button type="submit" className="btn primary">
            検索
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={useCurrentLocation}
          >
            現在地
          </button>
        </form>

        {history.length > 0 && (
          <div className="chip-row" aria-label="検索履歴">
            <span className="chip-label">最近の検索</span>
            {history.map((city) => (
              <button
                key={city}
                type="button"
                className="chip"
                onClick={() => searchFromHistory(city)}
              >
                {city}
              </button>
            ))}
          </div>
        )}

        {favorites.length > 0 && (
          <div className="chip-row" aria-label="お気に入り都市">
            <span className="chip-label">お気に入り</span>
            {favorites.map((fav) => (
              <span key={`${fav.lat},${fav.lon}`} className="chip-wrap">
                <button
                  type="button"
                  className="chip fav"
                  onClick={() => loadFavorite(fav)}
                >
                  ★ {fav.name}
                </button>
                <button
                  type="button"
                  className="chip-remove"
                  aria-label={`${fav.name}をお気に入りから削除`}
                  onClick={() => removeFavorite(fav)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {loading && <div className="notice">読み込み中…</div>}
        {error && <div className="notice error">{error}</div>}
        {stale && data && fetchedAt && (
          <div className="notice stale" role="status">
            通信に失敗したため、{minutesAgo(fetchedAt)}
            分前に取得したデータを表示しています。
          </div>
        )}

        {data && (
          <>
            <section className="current-card">
              <div className="current-main">
                <div className="current-place">
                  <h2>
                    {data.location.name}
                    {data.location.country ? `, ${data.location.country}` : ""}
                  </h2>
                  <p className="current-desc">{data.current.description}</p>
                  <button
                    type="button"
                    className={`btn fav-btn ${isFavorite(data) ? "on" : ""}`}
                    onClick={toggleFavorite}
                    aria-pressed={isFavorite(data)}
                  >
                    {isFavorite(data) ? "★ お気に入り済み" : "☆ お気に入りに追加"}
                  </button>
                </div>
                <div className="current-temp">
                  <WeatherIcon
                    icon={data.current.icon}
                    alt={data.current.description}
                    size={96}
                  />
                  <span className="temp-big">
                    {Math.round(data.current.temp)}°
                  </span>
                </div>
              </div>
              <div className="current-stats">
                <div className="stat">
                  <span className="stat-label">体感</span>
                  <span className="stat-value">
                    {Math.round(data.current.feelsLike)}°
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">湿度</span>
                  <span className="stat-value">{data.current.humidity}%</span>
                </div>
                <div className="stat">
                  <span className="stat-label">風速</span>
                  <span className="stat-value">
                    {data.current.windSpeed.toFixed(1)} m/s
                  </span>
                </div>
              </div>
            </section>

            {advice.length > 0 && (
              <section className="advice" aria-label="服装・持ち物アドバイス">
                <h3 className="panel-title">今日のアドバイス</h3>
                <ul>
                  {advice.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </section>
            )}

            <div className="layout">
              <section className="panel">
                <h3 className="panel-title">カレンダー</h3>
                <Calendar
                  availableDates={data.daily.map((d) => d.date)}
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                />
              </section>

              <section className="panel">
                <h3 className="panel-title">
                  {selectedDay ? formatDateLabel(selectedDay.date) : "予報"}
                </h3>
                {selectedDay && (
                  <div className="day-detail">
                    <div className="day-summary">
                      <WeatherIcon
                        icon={selectedDay.icon}
                        alt={selectedDay.description}
                        size={72}
                      />
                      <div>
                        <p className="day-desc">{selectedDay.description}</p>
                        <p className="day-temps">
                          <span className="max">
                            {Math.round(selectedDay.tempMax)}°
                          </span>
                          {" / "}
                          <span className="min">
                            {Math.round(selectedDay.tempMin)}°
                          </span>
                        </p>
                      </div>
                      <div className="day-meta">
                        <span>湿度 {selectedDay.humidity}%</span>
                        <span>
                          降水確率 {Math.round(selectedDay.pop * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="hours">
                      {selectedDay.hours.map((h) => (
                        <div key={h.dt} className="hour">
                          <span className="hour-time">{formatHour(h.dt)}</span>
                          <WeatherIcon
                            icon={h.icon}
                            alt={h.description}
                            size={40}
                          />
                          <span className="hour-temp">
                            {Math.round(h.temp)}°
                          </span>
                          <span className="hour-pop">
                            ☔ {Math.round(h.pop * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>

            <section className="week">
              <h3 className="panel-title">週間予報</h3>
              <div className="week-grid">
                {data.daily.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    className={`week-day ${
                      d.date === selectedDate ? "active" : ""
                    }`}
                    onClick={() => setSelectedDate(d.date)}
                  >
                    <span className="week-label">
                      {formatDateLabel(d.date)}
                    </span>
                    <WeatherIcon icon={d.icon} alt={d.description} size={48} />
                    <span className="week-temps">
                      <span className="max">{Math.round(d.tempMax)}°</span>
                      {" / "}
                      <span className="min">{Math.round(d.tempMin)}°</span>
                    </span>
                    <span className="week-pop">
                      ☔ {Math.round(d.pop * 100)}%
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        <footer className="footer">
          データ提供:{" "}
          <a
            href="https://openweathermap.org/"
            target="_blank"
            rel="noreferrer"
          >
            OpenWeatherMap
          </a>
        </footer>
      </div>
    </main>
  );
}
