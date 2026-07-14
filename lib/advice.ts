import type { CurrentWeather, DailyForecast } from "./types";

/**
 * 気温・降水確率・風速から服装・持ち物の一言アドバイスを生成する。
 */
export function buildAdvice(
  current: CurrentWeather,
  today?: DailyForecast | null
): string[] {
  const tips: string[] = [];
  const temp = current.feelsLike;
  const pop = today?.pop ?? 0;
  const wind = current.windSpeed;

  if (temp <= 5) {
    tips.push("厚手のコート・手袋がおすすめです");
  } else if (temp <= 12) {
    tips.push("ジャケットや羽織りものを用意しましょう");
  } else if (temp <= 20) {
    tips.push("長袖やカーディガンがあると安心です");
  } else if (temp <= 28) {
    tips.push("半袖で快適に過ごせそうです");
  } else {
    tips.push("暑さ対策を。水分補給と日傘・帽子を");
  }

  if (pop >= 0.6) {
    tips.push("傘が必要です（降水確率が高め）");
  } else if (pop >= 0.3) {
    tips.push("折りたたみ傘があると安心です");
  }

  if (wind >= 10) {
    tips.push("強風注意。帽子などは飛ばされやすいです");
  } else if (wind >= 6) {
    tips.push("風が少し強め。軽めの羽織りがあると安心です");
  }

  return tips;
}
