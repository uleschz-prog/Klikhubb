"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

export function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
    const sync = () => setFine(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return fine;
}

export function LandingReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function CountUp({
  to,
  suffix = "",
  prefix = "",
  className = "",
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(reduced ? to : 0);

  useEffect(() => {
    if (reduced) {
      setValue(to);
      return;
    }
    if (!inView) return;
    const started = performance.now();
    const duration = 1100;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(to * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, to]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}

export function Magnetic({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const ref = useRef<HTMLDivElement>(null);

  function onMove(event: MouseEvent<HTMLDivElement>) {
    if (!fine || reduced || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    const x = (event.clientX - box.left - box.width / 2) / 6;
    const y = (event.clientY - box.top - box.height / 2) / 6;
    ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function onLeave() {
    if (ref.current) ref.current.style.transform = "translate3d(0, 0, 0)";
  }

  return (
    <div
      ref={ref}
      className={`inline-flex will-change-transform ${className}`}
      style={{ transition: "transform 160ms ease" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}
