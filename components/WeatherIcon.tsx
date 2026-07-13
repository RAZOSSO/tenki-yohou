/* eslint-disable @next/next/no-img-element */
export default function WeatherIcon({
  icon,
  alt,
  size = 64,
}: {
  icon: string;
  alt?: string;
  size?: number;
}) {
  const src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  return (
    <img
      src={src}
      alt={alt ?? "weather icon"}
      width={size}
      height={size}
      loading="lazy"
    />
  );
}
