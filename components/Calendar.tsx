"use client";

import { useState } from "react";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Calendar({
  availableDates,
  selected,
  onSelect,
}: {
  availableDates: string[];
  selected: string | null;
  onSelect: (date: string) => void;
}) {
  const available = new Set(availableDates);
  const initial = selected ?? availableDates[0] ?? ymd(new Date());
  const [year, month] = (() => {
    const [y, m] = initial.split("-").map(Number);
    return [y, m - 1];
  })();
  const [view, setView] = useState<{ year: number; month: number }>({
    year,
    month,
  });

  const firstOfMonth = new Date(view.year, view.month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    cells.push(new Date(view.year, view.month, d));

  const monthLabel = `${view.year}年 ${view.month + 1}月`;

  const changeMonth = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button
          type="button"
          className="cal-nav"
          onClick={() => changeMonth(-1)}
          aria-label="前の月"
        >
          ‹
        </button>
        <span className="cal-title">{monthLabel}</span>
        <button
          type="button"
          className="cal-nav"
          onClick={() => changeMonth(1)}
          aria-label="次の月"
        >
          ›
        </button>
      </div>
      <div className="calendar-grid">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`cal-weekday ${i === 0 ? "sun" : ""} ${
              i === 6 ? "sat" : ""
            }`}
          >
            {w}
          </div>
        ))}
        {cells.map((date, idx) => {
          if (!date) return <div key={`e${idx}`} className="cal-cell empty" />;
          const key = ymd(date);
          const isAvailable = available.has(key);
          const isSelected = key === selected;
          const wd = date.getDay();
          return (
            <button
              key={key}
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && onSelect(key)}
              className={[
                "cal-cell",
                isAvailable ? "available" : "unavailable",
                isSelected ? "selected" : "",
                wd === 0 ? "sun" : "",
                wd === 6 ? "sat" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
      <p className="cal-hint">予報のある日付を選べます</p>
    </div>
  );
}
