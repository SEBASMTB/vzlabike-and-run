"use client";

import { useSyncExternalStore, useCallback, useRef, useId } from "react";

interface CountdownTimerProps {
  targetDate: string | Date;
  className?: string;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - Date.now();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

const serverSnapshot: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

export function CountdownTimer({
  targetDate,
  className,
  compact = false,
}: CountdownTimerProps) {
  const target = new Date(targetDate);
  const cachedRef = useRef<TimeLeft | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listenersRef = useRef(new Set<() => void>());

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);

    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        cachedRef.current = null;
        listenersRef.current.forEach((fn) => fn());
      }, 1000);
    }

    return () => {
      listenersRef.current.delete(listener);
      if (listenersRef.current.size === 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const getSnapshot = useCallback((): TimeLeft => {
    if (!cachedRef.current) {
      cachedRef.current = calculateTimeLeft(target);
    }
    return cachedRef.current;
  }, [target]);

  const getServerSnapshot = useCallback((): TimeLeft => {
    return serverSnapshot;
  }, []);

  const timeLeft = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const displayUnits = [
    { value: timeLeft.days, label: "Días" },
    { value: timeLeft.hours, label: "Horas" },
    { value: timeLeft.minutes, label: "Min" },
    { value: timeLeft.seconds, label: "Seg" },
  ];

  return (
    <div className={`flex gap-2 ${className}`}>
      {displayUnits.map((unit, i) => (
        <div key={i} className="flex flex-col items-center">
          <span
            className={`font-bold tabular-nums ${
              compact ? "text-lg" : "text-2xl md:text-3xl"
            } bg-gradient-to-b from-red-400 to-red-600 text-white rounded-lg px-2 py-1 min-w-[40px] text-center`}
          >
            {String(unit.value).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-muted-foreground mt-1 uppercase">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
