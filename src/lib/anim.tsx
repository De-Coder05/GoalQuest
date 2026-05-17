"use client";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

export function usePrefersReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(mq.matches);
    const fn = () => setR(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return r;
}

export function CountUp({ value, duration = 1000, suffix = "" }: { value: number; duration?: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const rm = usePrefersReducedMotion();
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (rm) { setN(value); return; }
    let raf = 0;
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); startRef.current = null; };
  }, [value, duration, rm]);
  return <>{n}{suffix}</>;
}

export function burstConfetti() {
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.6 },
    scalar: 0.8,
    ticks: 80,
  });
}

export function progressTone(p: number) {
  if (p >= 100) return "var(--success)";
  if (p >= 50) return "var(--warning)";
  return "var(--destructive)";
}

export function Spinner({ className = "" }: { className?: string }) {
  return <span className={`gq-spinner inline-block ${className}`} aria-hidden />;
}
