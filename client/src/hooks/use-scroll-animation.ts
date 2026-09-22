import { useEffect, useRef, useState, useCallback } from "react";

type AnimationType = "fade-up" | "fade-in" | "slide-left" | "slide-right" | "scale-up" | "fade-up-stagger" | "blur-up" | "blur-in";

interface ScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  delay?: number;
}

export function useScrollAnimation(
  animation: AnimationType = "fade-up",
  options: ScrollAnimationOptions = {}
) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { threshold = 0.15, rootMargin = "0px 0px -50px 0px", once = true, delay = 0 } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setIsVisible(true), delay);
          } else {
            setIsVisible(true);
          }
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once, delay]);

  const className = `scroll-animate scroll-${animation}${isVisible ? " scroll-visible" : ""}`;

  return { ref, className, isVisible };
}

export function useStaggerChildren(options: ScrollAnimationOptions = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [el, setEl] = useState<HTMLElement | null>(null);
  const { threshold = 0.1, rootMargin = "0px 0px -30px 0px", once = true } = options;

  const ref = useCallback((node: HTMLElement | null) => {
    setEl(node);
  }, []);

  useEffect(() => {
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [el, threshold, rootMargin, once]);

  return { ref, isVisible };
}
