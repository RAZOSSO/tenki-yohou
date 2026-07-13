export type Location = {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
};

export type CurrentWeather = {
  dt: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
};

export type HourlyEntry = {
  dt: number;
  temp: number;
  humidity: number;
  pop: number; // 0..1 降水確率
  description: string;
  icon: string;
};

export type DailyForecast = {
  date: string; // YYYY-MM-DD (対象地域のローカル日付)
  tempMin: number;
  tempMax: number;
  humidity: number;
  pop: number; // 0..1 その日の最大降水確率
  description: string;
  icon: string;
  hours: HourlyEntry[];
};

export type WeatherResponse = {
  location: Location;
  current: CurrentWeather;
  daily: DailyForecast[];
};
