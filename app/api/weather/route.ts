import { NextResponse } from "next/server";
import type {
  CurrentWeather,
  DailyForecast,
  HourlyEntry,
  Location,
  WeatherResponse,
} from "@/lib/types";

const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

function localDateString(dtSeconds: number, tzOffsetSeconds: number): string {
  // 対象地域のローカル時刻に変換してから YYYY-MM-DD を取り出す
  const d = new Date((dtSeconds + tzOffsetSeconds) * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(request: Request) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "サーバーに OPENWEATHER_API_KEY が設定されていません。" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");

  let lat: number;
  let lon: number;
  let resolved: Partial<Location> = {};

  try {
    if (latParam && lonParam) {
      lat = parseFloat(latParam);
      lon = parseFloat(lonParam);
      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        return NextResponse.json({ error: "緯度・経度が不正です。" }, { status: 400 });
      }
    } else if (city) {
      const geoUrl = `${GEO_URL}?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`;
      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) {
        if (geoRes.status === 401) {
          return NextResponse.json(
            {
              error:
                "API キーが無効か、まだ有効化されていません。新規キーは有効化まで最大2時間ほどかかります。しばらく待って再度お試しください。",
            },
            { status: 401 }
          );
        }
        return NextResponse.json(
          { error: "地名の検索に失敗しました。" },
          { status: geoRes.status }
        );
      }
      const geo = (await geoRes.json()) as Array<{
        name: string;
        country: string;
        state?: string;
        lat: number;
        lon: number;
        local_names?: Record<string, string>;
      }>;
      if (!geo.length) {
        return NextResponse.json(
          { error: `「${city}」に一致する都市が見つかりませんでした。` },
          { status: 404 }
        );
      }
      const g = geo[0];
      lat = g.lat;
      lon = g.lon;
      resolved = {
        name: g.local_names?.ja ?? g.name,
        country: g.country,
        state: g.state,
        lat: g.lat,
        lon: g.lon,
      };
    } else {
      return NextResponse.json(
        { error: "city または lat/lon のいずれかが必要です。" },
        { status: 400 }
      );
    }

    const common = `lat=${lat}&lon=${lon}&units=metric&lang=ja&appid=${apiKey}`;
    const [curRes, fcRes] = await Promise.all([
      fetch(`${CURRENT_URL}?${common}`),
      fetch(`${FORECAST_URL}?${common}`),
    ]);

    if (!curRes.ok || !fcRes.ok) {
      if (curRes.status === 401 || fcRes.status === 401) {
        return NextResponse.json(
          {
            error:
              "API キーが無効か、まだ有効化されていません。新規キーは有効化まで最大2時間ほどかかります。しばらく待って再度お試しください。",
          },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: "天気データの取得に失敗しました。" },
        { status: 502 }
      );
    }

    const cur = await curRes.json();
    const fc = await fcRes.json();
    const tz: number = fc.city?.timezone ?? cur.timezone ?? 0;

    const location: Location = {
      name: resolved.name ?? cur.name ?? fc.city?.name ?? "現在地",
      country: resolved.country ?? cur.sys?.country ?? fc.city?.country ?? "",
      state: resolved.state,
      lat,
      lon,
    };

    const current: CurrentWeather = {
      dt: cur.dt,
      temp: cur.main.temp,
      feelsLike: cur.main.feels_like,
      humidity: cur.main.humidity,
      description: cur.weather?.[0]?.description ?? "",
      icon: cur.weather?.[0]?.icon ?? "01d",
      windSpeed: cur.wind?.speed ?? 0,
    };

    // 3時間毎の予報を日付ごとにまとめる
    const buckets = new Map<string, HourlyEntry[]>();
    for (const item of fc.list as any[]) {
      const entry: HourlyEntry = {
        dt: item.dt,
        temp: item.main.temp,
        humidity: item.main.humidity,
        pop: item.pop ?? 0,
        description: item.weather?.[0]?.description ?? "",
        icon: item.weather?.[0]?.icon ?? "01d",
      };
      const key = localDateString(item.dt, tz);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(entry);
    }

    const daily: DailyForecast[] = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, hours]) => {
        const temps = hours.map((h) => h.temp);
        const humidities = hours.map((h) => h.humidity);
        const pops = hours.map((h) => h.pop);
        // 正午に最も近い時間帯を代表天気とする
        const rep = hours.reduce((best, h) => {
          const hourOf = (e: HourlyEntry) =>
            new Date((e.dt + tz) * 1000).getUTCHours();
          return Math.abs(hourOf(h) - 12) < Math.abs(hourOf(best) - 12)
            ? h
            : best;
        }, hours[0]);
        return {
          date,
          tempMin: Math.min(...temps),
          tempMax: Math.max(...temps),
          humidity: Math.round(
            humidities.reduce((s, v) => s + v, 0) / humidities.length
          ),
          pop: Math.max(...pops),
          description: rep.description,
          icon: rep.icon,
          hours,
        };
      });

    const payload: WeatherResponse = { location, current, daily };
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=1800" },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "予期しないエラーが発生しました。" },
      { status: 500 }
    );
  }
}
