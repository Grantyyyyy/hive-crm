import { useEffect, useRef, useState } from "react";
import type { LandingTheme } from "./types";

interface StatsSectionProps {
  theme: LandingTheme;
}

interface CounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}

function AnimatedCounter({ value, duration = 2000, suffix = "", prefix = "" }: CounterProps) {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime: number | null = null;
          const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * value));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 },
    );

    if (countRef.current) observer.observe(countRef.current);
    return () => observer.disconnect();
  }, [duration, hasAnimated, value]);

  return (
    <span ref={countRef} className="tabular-nums">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatsSection({ theme }: StatsSectionProps) {
  const isDark = theme === "dark";

  return (
    <section className={`py-10 border-b ${isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"}`}>
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-6">
          {[
            { value: 12400, label: "Active Users", suffix: "+" },
            { value: 1.2, label: "Revenue Managed", prefix: "$", suffix: "B" },
            { value: 500, label: "Enterprise Orgs", suffix: "+" },
            { value: 99.99, label: "System Uptime", suffix: "%" },
          ].map((stat, i) => (
            <div key={i} className="space-y-4">
              <p className={`text-[10px] font-black uppercase tracking-[0.5em] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                {stat.label}
              </p>
              <p className={`text-4xl lg:text-6xl font-black tracking-tight uppercase ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
