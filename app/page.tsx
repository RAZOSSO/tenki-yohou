"use client";

import { useEffect, useState } from "react";
import Calendar from "@/components/Calendar";
import WeatherIcon from "@/components/WeatherIcon";
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

  async function load(url: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "取得に失敗しました。");
      }
      const weather = json as WeatherResponse;
      setData(weather);
      setSelectedDate(weather.daily[0]?.date ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました。");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function searchCity(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    load(`/api/weather?city=${encodeURIComponent(query.trim())}`);
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
      }
    );
  }

  // 初回は東京を表示
  useEffect(() => {
    load(`/api/weather?city=${encodeURIComponent("Tokyo")}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedDay =
    data?.daily.find((d) => d.date === selectedDate) ?? data?.daily[0] ?? null;

  return (
    <main className="page">
      <div className="container">
        <header className="hero">
          <h1>天気予報</h1>
          <p className="subtitle">OpenWeatherMap 連携 / 週間予報 &amp; カレンダー</p>
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

        {loading && <div className="notice">読み込み中…</div>}
        {error && <div className="notice error">{error}</div>}

        {data && !loading && (
          <>
            <section className="current-card">
              <div className="current-main">
                <div className="current-place">
                  <h2>
                    {data.location.name}
                    {data.location.country ? `, ${data.location.country}` : ""}
                  </h2>
                  <p className="current-desc">{data.current.description}</p>
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
          <a href="https://openweathermap.org/" target="_blank" rel="noreferrer">
            OpenWeatherMap
          </a>
        </footer>
      </div>
    </main>
  );
}
