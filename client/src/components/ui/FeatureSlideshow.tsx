import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowRight, Pause, Play } from "lucide-react";

type Slide = {
  tag: string;
  title: string;
  accent: string;
  desc: string;
  cta: string;
  href: string;
  image?: string;
  pos?: string;
  collage?: string[];
};

const SPINNER_PHOTOS = [
  "/spinners/spinner-1.png",
  "/spinners/spinner-2.png",
  "/spinners/spinner-3.png",
  "/spinners/spinner-4.png",
];

const COLLAGE_ROTATIONS = ["-2.5deg", "2deg", "1.5deg", "-2deg"];

const SLIDES: Slide[] = [
  {
    tag: "New Stock",
    title: "Fresh",
    accent: "New Arrivals",
    desc: "New wheels added to the catalogue every week. Weds, Work, SSR, Enkei and more. Verified authentic.",
    cta: "Shop New Stock",
    href: "/collections/wheels-for-sale",
    image: "/images/inner-barrel.webp",
    pos: "object-center",
  },
  {
    tag: "Spinner Inventory",
    title: "Spinners",
    accent: "In Stock",
    desc: "Animated JDM split-spoke designs. Rare styles, cleaned up and ready to ship from our warehouse.",
    cta: "Browse Spinners",
    href: "/products/chrome-wheel-spinners",
    collage: SPINNER_PHOTOS,
  },
  {
    tag: "Configurator",
    title: "Lips",
    accent: "& Barrels",
    desc: "Build your multi-piece wheel your way. Flat lips, step lips, inner barrels in custom widths and finishes.",
    cta: "Configure Parts",
    href: "/parts-configurator",
    image: "/images/outer-lip.webp",
    pos: "object-center",
  },
];

const N = SLIDES.length;
// Seconds for one slide to drift fully across — controls auto-speed
const SECS_PER_SLIDE = 6.4;

function SlideBackground({ slide, eager }: { slide: Slide; eager: boolean }) {
  if (slide.collage) {
    return (
      <>
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div
          className="absolute top-0 bottom-0 right-0 grid grid-cols-2 grid-rows-2 gap-2 p-3"
          style={{ width: "56%" }}
        >
          {slide.collage.map((src, idx) => (
            <div
              key={idx}
              className="overflow-hidden"
              style={{
                transform: `rotate(${COLLAGE_ROTATIONS[idx]})`,
                boxShadow: "0 6px 24px rgba(0,0,0,0.7)",
                border: "2px solid rgba(255,255,255,0.1)",
              }}
            >
              <img
                src={src}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover"
                loading={eager ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </>
    );
  }
  return (
    <>
      <img
        src={slide.image}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full object-cover ${slide.pos ?? "object-center"}`}
        loading={eager ? "eager" : "lazy"}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
    </>
  );
}

export function FeatureSlideshow({ newArrivalImages }: { newArrivalImages?: string[] }) {
  // Build the slides array, overriding the New Arrivals slide with real product photos when available
  const slides = SLIDES.map((s) =>
    s.tag === "New Stock" && newArrivalImages && newArrivalImages.length > 0
      ? { ...s, image: undefined, collage: newArrivalImages }
      : s
  );
  const DOUBLED = [...slides, ...slides];

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);       // current px offset (logical)
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartOffset = useRef(0);
  const hoveredRef = useRef(false);
  const dotRef = useRef(0);

  const [dotIndex, setDotIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const hasMoved = useRef(false); // true only after >5px movement

  // Respect reduced-motion preference: start paused
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      pausedRef.current = true;
      setPaused(true);
    }
  }, []);

  const togglePaused = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  };

  // ── RAF drift loop ──────────────────────────────────────────────────
  useEffect(() => {
    const loop = (time: number) => {
      const container = containerRef.current;
      const track = trackRef.current;
      if (container && track) {
        const W = container.offsetWidth;
        const totalW = W * N; // one full set in px

        if (!isDragging.current && !hoveredRef.current && !pausedRef.current && W > 0) {
          const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
          const speed = W / SECS_PER_SLIDE; // px/s — same visual speed on all screen sizes
          offsetRef.current = (offsetRef.current + speed * dt) % totalW;
        }
        lastTimeRef.current = time;

        track.style.transform = `translateX(-${offsetRef.current}px)`;

        // Update dot indicator only when slide changes
        if (W > 0) {
          const newDot = Math.floor(offsetRef.current / W) % N;
          if (newDot !== dotRef.current) {
            dotRef.current = newDot;
            setDotIndex(newDot);
          }
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Touch events (non-passive so we can prevent scroll) ────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      isDragging.current = true;
      setDragging(true);
      dragStartX.current = e.touches[0].clientX;
      dragStartOffset.current = offsetRef.current;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const W = containerRef.current?.offsetWidth ?? 1;
      const totalW = W * N;
      const delta = dragStartX.current - e.touches[0].clientX;
      offsetRef.current = ((dragStartOffset.current + delta) % totalW + totalW) % totalW;
    };

    const onTouchEnd = () => {
      isDragging.current = false;
      setDragging(false);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  // ── Mouse drag ─────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    // Don't preventDefault — we need clicks on links to work
    isDragging.current = true;
    hasMoved.current = false;
    dragStartX.current = e.clientX;
    dragStartOffset.current = offsetRef.current;

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = dragStartX.current - ev.clientX;
      if (!hasMoved.current && Math.abs(delta) > 5) {
        hasMoved.current = true;
        setDragging(true); // only now block pointer-events on links
      }
      if (!hasMoved.current) return;
      const W = containerRef.current?.offsetWidth ?? 1;
      const totalW = W * N;
      offsetRef.current = ((dragStartOffset.current + delta) % totalW + totalW) % totalW;
    };
    const onUp = () => {
      isDragging.current = false;
      hasMoved.current = false;
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden border-b border-white/10"
      style={{
        height: "clamp(320px, 48vw, 500px)",
        cursor: dragging ? "grabbing" : "grab",
        userSelect: "none",
      }}
      onMouseEnter={() => { hoveredRef.current = true; }}
      onMouseLeave={() => { hoveredRef.current = false; }}
      onMouseDown={onMouseDown}
      data-testid="feature-slideshow"
    >
      {/* Drifting / draggable track */}
      <div
        ref={trackRef}
        className="flex h-full will-change-transform"
        style={{ width: `${DOUBLED.length * 100}%` }}
      >
        {DOUBLED.map((slide, i) => (
          <div
            key={i}
            className="relative h-full flex-none"
            style={{ width: `${100 / DOUBLED.length}%` }}
          >
            <SlideBackground slide={slide} eager={i === 0} />

            {/* Text — pointer-events disabled during drag so links don't fire accidentally */}
            <div
              className="absolute inset-0 flex items-center"
              style={{ pointerEvents: dragging ? "none" : "auto" }}
            >
              <div className="px-6 md:px-12 lg:px-16 max-w-xl">
                <span className="block text-primary font-tech uppercase tracking-[0.3em] text-xs mb-4">
                  {slide.tag}
                </span>
                <h2 className="font-display font-bold uppercase leading-none mb-4">
                  <span className="text-4xl sm:text-5xl md:text-6xl text-white">{slide.title}</span>
                  <br />
                  <span className="text-4xl sm:text-5xl md:text-6xl text-primary">{slide.accent}</span>
                </h2>
                <Link
                  href={slide.href}
                  className="inline-flex items-center gap-2 bg-primary text-black font-tech uppercase tracking-widest text-xs h-12 px-8 hover:bg-white transition-colors"
                  data-testid={`link-slide-${i % N}`}
                  draggable={false}
                >
                  {slide.cta} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pause / play control */}
      <button
        type="button"
        onClick={togglePaused}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label={paused ? "Play slideshow" : "Pause slideshow"}
        aria-pressed={paused}
        className="absolute bottom-4 right-4 z-10 flex items-center justify-center w-8 h-8 border border-white/20 bg-black/40 text-white/60 hover:text-white hover:border-white/50 transition-colors"
        data-testid="button-slideshow-pause"
      >
        {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 pointer-events-none">
        {slides.map((_, i) => (
          <div
            key={i}
            className="transition-all duration-500"
            style={{
              width: i === dotIndex ? "24px" : "6px",
              height: "4px",
              background: i === dotIndex ? "var(--primary, #E9D355)" : "rgba(255,255,255,0.25)",
            }}
            data-testid={`dot-${i}`}
          />
        ))}
      </div>
    </div>
  );
}
