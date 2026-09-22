import { useEffect, useRef, useState } from "react";

interface TextRevealProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  className?: string;
  wordDelay?: number;
  subtitle?: string;
  subtitleClassName?: string;
  subtitleDelay?: number;
}

export function TextReveal({
  text,
  as: Tag = "h2",
  className = "",
  wordDelay = 60,
  subtitle,
  subtitleClassName = "",
  subtitleDelay = 300,
}: TextRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const words = text.split(" ");

  return (
    <div ref={ref} className={`${isVisible ? "text-reveal-visible" : ""}`}>
      <Tag className={className}>
        {words.map((word, i) => (
          <span
            key={i}
            className="text-reveal-word"
            style={{ transitionDelay: isVisible ? `${i * wordDelay}ms` : "0ms" }}
          >
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </span>
        ))}
      </Tag>
      {subtitle && (
        <p
          className={`text-reveal-line ${subtitleClassName}`}
          style={{ transitionDelay: isVisible ? `${words.length * wordDelay + subtitleDelay}ms` : "0ms" }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
