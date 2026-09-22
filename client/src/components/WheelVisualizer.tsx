import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { X, Upload, ZoomIn, ZoomOut, RotateCcw, Move, ImageIcon, Loader2, CircleDot, Share2, Download, Minus, Plus, Disc, Palette, Check, Settings2, ChevronDown, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language";

interface WheelVisualizerProps {
  wheelImageUrl: string;
  productTitle: string;
  onClose: () => void;
  isLocalImage?: boolean;
  onAddToCart?: () => void;
  productPrice?: string;
  isAddingToCart?: boolean;
}

interface WheelOverlay {
  id: number;
  x: number;
  y: number;
  scale: number;
}

interface CropCircle {
  x: number;
  y: number;
  radius: number;
}

type Step = "crop" | "place";

function drawBrakeDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, showCaliper: boolean = false) {
  ctx.save();

  if (showCaliper) {
    const caliperWidth = radius * 0.45;
    const caliperHeight = radius * 0.7;
    const caliperX = cx + radius * 0.25;
    const caliperY = cy - caliperHeight / 2;

    ctx.save();
    const caliperGrad = ctx.createLinearGradient(caliperX, caliperY, caliperX + caliperWidth, caliperY);
    caliperGrad.addColorStop(0, "#cc2222");
    caliperGrad.addColorStop(0.3, "#dd3333");
    caliperGrad.addColorStop(0.5, "#ee4444");
    caliperGrad.addColorStop(0.7, "#dd3333");
    caliperGrad.addColorStop(1, "#aa1111");

    const cR = radius * 0.06;
    ctx.beginPath();
    ctx.moveTo(caliperX + cR, caliperY);
    ctx.lineTo(caliperX + caliperWidth - cR, caliperY);
    ctx.arcTo(caliperX + caliperWidth, caliperY, caliperX + caliperWidth, caliperY + cR, cR);
    ctx.lineTo(caliperX + caliperWidth, caliperY + caliperHeight - cR);
    ctx.arcTo(caliperX + caliperWidth, caliperY + caliperHeight, caliperX + caliperWidth - cR, caliperY + caliperHeight, cR);
    ctx.lineTo(caliperX + cR, caliperY + caliperHeight);
    ctx.arcTo(caliperX, caliperY + caliperHeight, caliperX, caliperY + caliperHeight - cR, cR);
    ctx.lineTo(caliperX, caliperY + cR);
    ctx.arcTo(caliperX, caliperY, caliperX + cR, caliperY, cR);
    ctx.closePath();
    ctx.fillStyle = caliperGrad;
    ctx.fill();
    ctx.strokeStyle = "#881111";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.moveTo(caliperX + cR, caliperY);
    ctx.lineTo(caliperX + caliperWidth - cR, caliperY);
    ctx.arcTo(caliperX + caliperWidth, caliperY, caliperX + caliperWidth, caliperY + cR, cR);
    ctx.lineTo(caliperX + caliperWidth, caliperY + caliperHeight * 0.3);
    ctx.lineTo(caliperX, caliperY + caliperHeight * 0.2);
    ctx.lineTo(caliperX, caliperY + cR);
    ctx.arcTo(caliperX, caliperY, caliperX + cR, caliperY, cR);
    ctx.closePath();
    ctx.fill();

    const boltPositions = [
      [caliperX + caliperWidth * 0.3, caliperY + caliperHeight * 0.15],
      [caliperX + caliperWidth * 0.7, caliperY + caliperHeight * 0.15],
      [caliperX + caliperWidth * 0.3, caliperY + caliperHeight * 0.85],
      [caliperX + caliperWidth * 0.7, caliperY + caliperHeight * 0.85],
    ];
    for (const [bx, by] of boltPositions) {
      ctx.beginPath();
      ctx.arc(bx, by, radius * 0.025, 0, Math.PI * 2);
      ctx.fillStyle = "#666";
      ctx.fill();
      ctx.strokeStyle = "#444";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    const slotY1 = caliperY + caliperHeight * 0.35;
    const slotY2 = caliperY + caliperHeight * 0.5;
    const slotY3 = caliperY + caliperHeight * 0.65;
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1;
    for (const sy of [slotY1, slotY2, slotY3]) {
      ctx.beginPath();
      ctx.moveTo(caliperX + caliperWidth * 0.15, sy);
      ctx.lineTo(caliperX + caliperWidth * 0.85, sy);
      ctx.stroke();
    }

    ctx.restore();
  }

  const discGrad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
  discGrad.addColorStop(0, "#555555");
  discGrad.addColorStop(0.3, "#444444");
  discGrad.addColorStop(0.7, "#3a3a3a");
  discGrad.addColorStop(1, "#2a2a2a");

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = discGrad;
  ctx.fill();

  ctx.strokeStyle = "#222";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.strokeStyle = "rgba(80,80,80,0.4)";
  ctx.lineWidth = 0.5;
  for (let r = radius * 0.35; r < radius * 0.95; r += radius * 0.06) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const drillRadius = radius * 0.025;
  const drillRings = [radius * 0.55, radius * 0.7, radius * 0.85];
  ctx.fillStyle = "#1a1a1a";
  for (const ring of drillRings) {
    const count = Math.round((ring / radius) * 20);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dx = cx + Math.cos(angle) * ring;
      const dy = cy + Math.sin(angle) * ring;
      ctx.beginPath();
      ctx.arc(dx, dy, drillRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = "#333";
  ctx.fill();
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const boltCount = 5;
  const boltRadius = radius * 0.03;
  for (let i = 0; i < boltCount; i++) {
    const angle = (i / boltCount) * Math.PI * 2 - Math.PI / 2;
    const bx = cx + Math.cos(angle) * radius * 0.16;
    const by = cy + Math.sin(angle) * radius * 0.16;
    ctx.beginPath();
    ctx.arc(bx, by, boltRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#222";
    ctx.fill();
  }

  ctx.restore();
}

export default function WheelVisualizer({ wheelImageUrl, productTitle, onClose, isLocalImage, onAddToCart, productPrice, isAddingToCart }: WheelVisualizerProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("crop");
  const [wheelLoaded, setWheelLoaded] = useState(false);
  const [wheelLoadError, setWheelLoadError] = useState(false);
  const [croppedWheelUrl, setCroppedWheelUrl] = useState<string | null>(null);
  const [brakeDiscUrl, setBrakeDiscUrl] = useState<string | null>(null);

  const [cropCircle, setCropCircle] = useState<CropCircle>({ x: 50, y: 50, radius: 40 });
  const [cropDragging, setCropDragging] = useState<"move" | "resize" | null>(null);
  const [cropDragStart, setCropDragStart] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const wheelImgRef = useRef<HTMLImageElement>(null);

  const [carImage, setCarImage] = useState<string | null>(null);
  const [wheels, setWheels] = useState<WheelOverlay[]>([]);
  const [activeWheelId, setActiveWheelId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);

  const [pictureZoom, setPictureZoom] = useState(1);
  const [picturePan, setPicturePan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [isGenerating, setIsGenerating] = useState(false);

  const [showBrakeDisc, setShowBrakeDisc] = useState(true);
  const [showCaliper, setShowCaliper] = useState(false);

  const [spokeColor, setSpokeColor] = useState<string | null>(null);
  const [coloredWheelUrl, setColoredWheelUrl] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customHue, setCustomHue] = useState(0);
  const [customSat, setCustomSat] = useState(100);
  const [customLight, setCustomLight] = useState(50);
  const [showMenu, setShowMenu] = useState(true);

  const proxyUrl = isLocalImage ? wheelImageUrl : `/api/image-proxy?url=${encodeURIComponent(wheelImageUrl)}`;

  useEffect(() => {
    if (!showBrakeDisc) {
      setBrakeDiscUrl(null);
      return;
    }
    const discCanvas = document.createElement("canvas");
    const discSize = 256;
    discCanvas.width = discSize;
    discCanvas.height = discSize;
    const discCtx = discCanvas.getContext("2d")!;
    drawBrakeDisc(discCtx, discSize / 2, discSize / 2, discSize / 2 - 2, showCaliper);
    setBrakeDiscUrl(discCanvas.toDataURL("image/png"));
  }, [showBrakeDisc, showCaliper]);

  const cropDraggingRef = useRef<"move" | "resize" | null>(null);
  const cropDragStartRef = useRef({ x: 0, y: 0 });

  const startCropDrag = (clientX: number, clientY: number, mode: "move" | "resize") => {
    setCropDragging(mode);
    cropDraggingRef.current = mode;
    setCropDragStart({ x: clientX, y: clientY });
    cropDragStartRef.current = { x: clientX, y: clientY };
  };

  const handleCropPointerDown = (e: React.PointerEvent, mode: "move" | "resize") => {
    e.preventDefault();
    e.stopPropagation();
    startCropDrag(e.clientX, e.clientY, mode);
    const target = e.currentTarget as HTMLElement;
    try { target.setPointerCapture(e.pointerId); } catch (_) {}
  };

  const handleCropTouchStart = (e: React.TouchEvent, mode: "move" | "resize") => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    startCropDrag(touch.clientX, touch.clientY, mode);
  };

  const processCropMove = useCallback(
    (clientX: number, clientY: number) => {
      const mode = cropDraggingRef.current;
      if (!mode || imgSize.w === 0) return;
      const iw = imgSize.w;
      const ih = imgSize.h;
      const startPt = cropDragStartRef.current;
      const dx = ((clientX - startPt.x) / iw) * 100;
      const dy = ((clientY - startPt.y) / ih) * 100;
      cropDragStartRef.current = { x: clientX, y: clientY };
      setCropDragStart({ x: clientX, y: clientY });

      if (mode === "move") {
        setCropCircle((prev) => {
          const minDim = Math.min(iw, ih);
          const radiusX = (prev.radius / 100) * minDim / iw * 100;
          const radiusY = (prev.radius / 100) * minDim / ih * 100;
          return {
            ...prev,
            x: Math.max(radiusX, Math.min(100 - radiusX, prev.x + dx)),
            y: Math.max(radiusY, Math.min(100 - radiusY, prev.y + dy)),
          };
        });
      } else {
        const pixelDist = Math.sqrt(
          (clientX - startPt.x) ** 2 + (clientY - startPt.y) ** 2
        ) * Math.sign((clientX - startPt.x) + (clientY - startPt.y));
        const minDim = Math.min(iw, ih);
        const radiusDelta = (pixelDist / minDim) * 100;
        setCropCircle((prev) => ({
          ...prev,
          radius: Math.max(10, Math.min(48, prev.radius + radiusDelta)),
        }));
      }
    },
    [imgSize]
  );

  const handleCropPointerMove = useCallback(
    (e: React.PointerEvent) => {
      processCropMove(e.clientX, e.clientY);
    },
    [processCropMove]
  );

  const handleCropPointerUp = () => {
    setCropDragging(null);
    cropDraggingRef.current = null;
  };

  useEffect(() => {
    if (step !== "crop" || !wheelLoaded || !wheelImgRef.current) return;
    const img = wheelImgRef.current;
    const measure = () => {
      const rect = img.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setImgSize({ w: rect.width, h: rect.height });
      }
    };
    const ro = new ResizeObserver(measure);
    ro.observe(img);
    setTimeout(measure, 200);
    return () => ro.disconnect();
  }, [step, wheelLoaded]);

  useEffect(() => {
    const container = cropContainerRef.current;
    if (!container || step !== "crop") return;
    const onTouchMove = (e: TouchEvent) => {
      if (!cropDraggingRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      processCropMove(touch.clientX, touch.clientY);
    };
    const onTouchEnd = () => {
      setCropDragging(null);
      cropDraggingRef.current = null;
    };
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);
    container.addEventListener("touchcancel", onTouchEnd);
    return () => {
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [step, processCropMove]);

  const confirmCrop = async () => {
    if (!wheelImgRef.current) return;

    const img = wheelImgRef.current;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;

    const cx = (cropCircle.x / 100) * natW;
    const cy = (cropCircle.y / 100) * natH;
    const r = (cropCircle.radius / 100) * Math.min(natW, natH);

    const size = Math.round(r * 2);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(
      img,
      cx - r, cy - r, r * 2, r * 2,
      0, 0, size, size
    );

    setCroppedWheelUrl(canvas.toDataURL("image/png"));
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCarImage(ev.target?.result as string);
      nextId.current = 1;
      setWheels([
        { id: nextId.current++, x: 25, y: 65, scale: 1 },
        { id: nextId.current++, x: 75, y: 65, scale: 1 },
      ]);
      setActiveWheelId(1);
      setPictureZoom(1);
      setPicturePan({ x: 0, y: 0 });
      setStep("place");
    };
    reader.readAsDataURL(file);
  };

  const addWheel = () => {
    const newWheel = { id: nextId.current++, x: 50, y: 50, scale: 1 };
    setWheels((prev) => [...prev, newWheel]);
    setActiveWheelId(newWheel.id);
  };

  const removeWheel = (id: number) => {
    setWheels((prev) => prev.filter((w) => w.id !== id));
    if (activeWheelId === id) setActiveWheelId(null);
  };

  const updateWheel = useCallback((id: number, updates: Partial<WheelOverlay>) => {
    setWheels((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  }, []);

  const adjustScale = (id: number, delta: number) => {
    setWheels((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, scale: Math.max(0.2, Math.min(3, w.scale + delta)) } : w
      )
    );
  };

  const handlePointerDown = (e: React.PointerEvent, wheelId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveWheelId(wheelId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning && containerRef.current) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        setPanStart({ x: e.clientX, y: e.clientY });
        setPicturePan((prev) => {
          const rect = containerRef.current!.getBoundingClientRect();
          const maxPan = (pictureZoom - 1) * Math.max(rect.width, rect.height) / 2;
          return {
            x: Math.max(-maxPan, Math.min(maxPan, prev.x + dx)),
            y: Math.max(-maxPan, Math.min(maxPan, prev.y + dy)),
          };
        });
        return;
      }
      if (!isDragging || activeWheelId === null || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((e.clientX - dragStart.x) / rect.width) * 100 / pictureZoom;
      const dy = ((e.clientY - dragStart.y) / rect.height) * 100 / pictureZoom;
      setDragStart({ x: e.clientX, y: e.clientY });
      updateWheel(activeWheelId, {
        x: Math.max(0, Math.min(100, (wheels.find((w) => w.id === activeWheelId)?.x || 0) + dx)),
        y: Math.max(0, Math.min(100, (wheels.find((w) => w.id === activeWheelId)?.y || 0) + dy)),
      });
    },
    [isDragging, isPanning, activeWheelId, dragStart, panStart, wheels, updateWheel, pictureZoom]
  );

  const handlePointerUp = () => {
    setIsDragging(false);
    setIsPanning(false);
  };

  const handleContainerPointerDown = (e: React.PointerEvent) => {
    if (pictureZoom > 1 && activeWheelId === null) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setPictureZoom((prev) => {
      const next = Math.max(1, Math.min(5, prev + delta));
      if (next === 1) setPicturePan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || step !== "place") return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel, step]);

  const adjustPictureZoom = (delta: number) => {
    setPictureZoom((prev) => {
      const next = Math.max(1, Math.min(5, prev + delta));
      if (next === 1) setPicturePan({ x: 0, y: 0 });
      return next;
    });
  };

  const resetWheels = () => {
    if (!carImage) return;
    nextId.current = 1;
    setWheels([
      { id: nextId.current++, x: 25, y: 65, scale: 1 },
      { id: nextId.current++, x: 75, y: 65, scale: 1 },
    ]);
    setActiveWheelId(1);
  };

  const generateCompositeImage = useCallback(async (): Promise<Blob | null> => {
    if (!carImage || !croppedWheelUrl) return null;

    const carImg = new Image();
    carImg.src = carImage;
    await new Promise<void>((r) => { carImg.onload = () => r(); });

    const wheelImg = new Image();
    wheelImg.src = coloredWheelUrl || croppedWheelUrl;
    await new Promise<void>((r) => { wheelImg.onload = () => r(); });

    let discImg: HTMLImageElement | null = null;
    if (brakeDiscUrl) {
      discImg = new Image();
      discImg.src = brakeDiscUrl;
      await new Promise<void>((r) => { discImg!.onload = () => r(); });
    }

    const canvas = document.createElement("canvas");
    canvas.width = carImg.naturalWidth;
    canvas.height = carImg.naturalHeight;
    const ctx = canvas.getContext("2d")!;

    ctx.drawImage(carImg, 0, 0);

    const containerEl = containerRef.current;
    let displayedCarWidth = canvas.width;
    if (containerEl) {
      const carImgEl = containerEl.querySelector("img");
      if (carImgEl) {
        displayedCarWidth = carImgEl.clientWidth;
      }
    }

    const pixelRatio = canvas.width / displayedCarWidth;

    for (const wheel of wheels) {
      const wx = (wheel.x / 100) * canvas.width;
      const wy = (wheel.y / 100) * canvas.height;
      const size = wheelBaseSize * wheel.scale * pixelRatio;

      if (discImg) {
        ctx.drawImage(
          discImg,
          wx - (size * 1.02) / 2,
          wy - (size * 1.02) / 2,
          size * 1.02,
          size * 1.02
        );
      }

      ctx.drawImage(
        wheelImg,
        wx - size / 2,
        wy - size / 2,
        size,
        size
      );
    }

    const barHeight = Math.max(30, canvas.height * 0.04);
    const fontSize = Math.max(12, barHeight * 0.45);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);
    ctx.fillStyle = "#E9D355";
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`${productTitle} — juju-wheels.com`, canvas.width / 2, canvas.height - barHeight * 0.3);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }, [carImage, croppedWheelUrl, coloredWheelUrl, brakeDiscUrl, wheels, productTitle]);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateCompositeImage();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `juju-wheels-${productTitle.replace(/\s+/g, "-").toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateCompositeImage();
      if (!blob) return;

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `juju-wheels-${productTitle.replace(/\s+/g, "-").toLowerCase()}.png`, { type: "image/png" });
        const shareData = {
          title: `${productTitle} — Juju Wheels`,
          text: `Check out these ${productTitle} wheels on my car! Via juju-wheels.com`,
          files: [file],
        };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `juju-wheels-${productTitle.replace(/\s+/g, "-").toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const presetColors = useMemo(() => [
    { name: "Gloss Black", color: "#111111" },
    { name: "Gunmetal", color: "#53565A" },
    { name: "Bronze", color: "#8B6914" },
    { name: "Gold", color: "#D4A017" },
    { name: "White", color: "#F0F0F0" },
    { name: "Candy Red", color: "#C41E3A" },
    { name: "Midnight Blue", color: "#003366" },
    { name: "Racing Green", color: "#004D40" },
    { name: "Hyper Silver", color: "#C0C0C0" },
    { name: "Copper", color: "#B87333" },
    { name: "Purple", color: "#6A0DAD" },
    { name: "Nardo Grey", color: "#7B7D7D" },
  ], []);

  const applyColorToWheel = useCallback((color: string) => {
    if (!croppedWheelUrl) return;
    setSpokeColor(color);

    const img = new Image();
    img.src = croppedWheelUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maxR = Math.min(cx, cy);
      const hubR = maxR * 0.18;

      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 30) continue;

        const px = (i / 4) % canvas.width;
        const py = Math.floor((i / 4) / canvas.width);
        const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);

        if (dist < hubR) continue;
        if (dist > maxR * 0.98) continue;

        const origR = data[i];
        const origG = data[i + 1];
        const origB = data[i + 2];
        const lum = (origR * 0.299 + origG * 0.587 + origB * 0.114) / 255;

        const blendStrength = 0.7;
        data[i] = Math.round(origR * (1 - blendStrength) + r * lum * blendStrength);
        data[i + 1] = Math.round(origG * (1 - blendStrength) + g * lum * blendStrength);
        data[i + 2] = Math.round(origB * (1 - blendStrength) + b * lum * blendStrength);
      }

      ctx.putImageData(imageData, 0, 0);
      setColoredWheelUrl(canvas.toDataURL("image/png"));
    };
  }, [croppedWheelUrl]);

  const clearColor = useCallback(() => {
    setSpokeColor(null);
    setColoredWheelUrl(null);
  }, []);

  const wheelBaseSize = 120;

  useEffect(() => {
    document.body.classList.add("visualizer-open");
    return () => document.body.classList.remove("visualizer-open");
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black" data-testid="modal-visualizer">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-black border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <ImageIcon className="w-4 h-4 text-primary" />
          <span className="text-white font-tech uppercase tracking-widest text-xs md:text-sm">
            {t("product.visualizerTitle")}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors p-1"
          data-testid="button-close-visualizer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {step === "crop" && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div
            ref={cropContainerRef}
            className="flex-1 relative overflow-hidden bg-neutral-950 flex items-center justify-center"
            style={{ touchAction: "none" }}
            onPointerMove={handleCropPointerMove}
            onPointerUp={handleCropPointerUp}
            onPointerCancel={handleCropPointerUp}
          >
            {wheelLoadError ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-red-400 text-sm">{t("product.visualizerError")}</p>
                <Button
                  onClick={() => {
                    setWheelLoadError(false);
                    setWheelLoaded(false);
                  }}
                  className="bg-primary text-black hover:bg-primary/90"
                  data-testid="button-retry-load"
                >
                  {t("product.visualizerRetry")}
                </Button>
              </div>
            ) : !wheelLoaded ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-white/60 text-sm">{t("product.visualizerProcessing")}</p>
              </div>
            ) : null}

            <div className="relative inline-block" style={{ display: wheelLoaded && !wheelLoadError ? "block" : "none" }}>
              <img
                ref={wheelImgRef}
                src={proxyUrl}
                alt={productTitle}
                crossOrigin={isLocalImage ? undefined : "anonymous"}
                className="max-w-full max-h-[70vh] object-contain select-none"
                draggable={false}
                onLoad={() => {
                  setWheelLoaded(true);
                  const measureImage = () => {
                    if (!wheelImgRef.current) return;
                    const rect = wheelImgRef.current.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                      setImgSize({ w: rect.width, h: rect.height });
                    } else {
                      setTimeout(measureImage, 100);
                    }
                  };
                  requestAnimationFrame(measureImage);
                }}
                onError={() => setWheelLoadError(true)}
              />

              {imgSize.w > 0 && imgSize.h > 0 && (() => {
                const iw = imgSize.w;
                const ih = imgSize.h;
                const minDim = Math.min(iw, ih);
                const radiusPx = (cropCircle.radius / 100) * minDim;
                const circlePx = radiusPx * 2;
                const cx = (cropCircle.x / 100) * iw;
                const cy = (cropCircle.y / 100) * ih;

                return (
                  <>
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${cx - radiusPx}px`,
                        top: `${cy - radiusPx}px`,
                        width: `${circlePx}px`,
                        height: `${circlePx}px`,
                      }}
                    >
                      <div className="absolute inset-0 rounded-full border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]" />
                    </div>

                    <div
                      className="absolute cursor-grab active:cursor-grabbing"
                      style={{
                        left: `${cx - radiusPx + 2}px`,
                        top: `${cy - radiusPx + 2}px`,
                        width: `${circlePx - 4}px`,
                        height: `${circlePx - 4}px`,
                        borderRadius: "50%",
                        touchAction: "none",
                      }}
                      onPointerDown={(e) => handleCropPointerDown(e, "move")}
                      onTouchStart={(e) => handleCropTouchStart(e, "move")}
                    />

                    {[0, 90, 180, 270].map((angle) => {
                      const rad = (angle * Math.PI) / 180;
                      const hx = cx + Math.cos(rad) * radiusPx;
                      const hy = cy + Math.sin(rad) * radiusPx;
                      return (
                        <div
                          key={angle}
                          className="absolute w-6 h-6 md:w-4 md:h-4 bg-primary rounded-full cursor-nwse-resize z-10"
                          style={{
                            left: `${hx}px`,
                            top: `${hy}px`,
                            transform: "translate(-50%, -50%)",
                            touchAction: "none",
                          }}
                          onPointerDown={(e) => handleCropPointerDown(e, "resize")}
                          onTouchStart={(e) => handleCropTouchStart(e, "resize")}
                        />
                      );
                    })}
                  </>
                );
              })()}
            </div>
          </div>

          <div className="w-full md:w-72 bg-black border-t md:border-t-0 md:border-l border-white/10 p-5 flex flex-col gap-4 shrink-0">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                <CircleDot className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">{t("product.visualizerCropTitle")}</p>
                <p className="text-white/40 text-[10px] uppercase tracking-widest">{t("product.visualizerStep")} 1/2</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-3 py-2 bg-white/5 border border-white/10">
              <img
                src={wheelImageUrl}
                alt={productTitle}
                className="w-10 h-10 object-contain"
              />
              <p className="text-white text-xs font-medium truncate">{productTitle}</p>
            </div>

            <p className="text-white/40 text-[10px] leading-relaxed">
              {t("product.visualizerCropHint")}
            </p>

            <div className="mt-auto flex flex-col gap-2">
              <Button
                onClick={confirmCrop}
                disabled={!wheelLoaded || wheelLoadError}
                className="w-full bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-wider"
                data-testid="button-confirm-crop"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t("product.visualizerCropConfirm")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

      {step === "place" && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* ── MOBILE TOP TOOLBAR ── */}
          <div className="md:hidden bg-black border-b border-white/10 px-3 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-white/10 bg-neutral-900">
              <img src={coloredWheelUrl || croppedWheelUrl || wheelImageUrl} alt={productTitle} className="w-full h-full object-contain" />
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={addWheel} className="h-7 px-2 bg-white/10 border border-white/20 text-white text-[9px] flex items-center gap-1 active:scale-95" data-testid="button-add-wheel-mobile"><Plus className="w-3 h-3" />{t("product.visualizerAddWheel")}</button>
              <button onClick={resetWheels} className="h-7 px-2 bg-white/10 border border-white/20 text-white text-[9px] flex items-center gap-1 active:scale-95" data-testid="button-reset-mobile"><RotateCcw className="w-3 h-3" /></button>
              <button onClick={() => { setCarImage(null); setWheels([]); setCroppedWheelUrl(null); setCropCircle({ x: 50, y: 50, radius: 40 }); setPictureZoom(1); setPicturePan({ x: 0, y: 0 }); setStep("crop"); }} className="h-7 px-2 bg-white/10 border border-white/20 text-white text-[9px] flex items-center gap-1 active:scale-95" data-testid="button-recrop-mobile"><CircleDot className="w-3 h-3" /></button>
              <button onClick={() => { setCarImage(null); setWheels([]); setPictureZoom(1); setPicturePan({ x: 0, y: 0 }); setStep("crop"); }} className="h-7 px-2 bg-white/10 border border-white/20 text-white text-[9px] flex items-center gap-1 active:scale-95" data-testid="button-change-photo-mobile"><Upload className="w-3 h-3" /></button>
            </div>
            <div className="w-px h-5 bg-white/10 shrink-0" />
            <div className="flex gap-1 shrink-0">
              <button onClick={() => adjustPictureZoom(-0.25)} disabled={pictureZoom <= 1} className="h-7 w-7 bg-white/10 border border-white/20 text-white flex items-center justify-center disabled:opacity-30 active:scale-95" data-testid="button-zoom-out-mobile"><ZoomOut className="w-3 h-3" /></button>
              <button onClick={() => adjustPictureZoom(0.25)} disabled={pictureZoom >= 5} className="h-7 w-7 bg-white/10 border border-white/20 text-white flex items-center justify-center disabled:opacity-30 active:scale-95" data-testid="button-zoom-in-mobile"><ZoomIn className="w-3 h-3" /></button>
            </div>
          </div>

          {/* ── CAR PREVIEW ── */}
          <div
            ref={containerRef}
            className="flex-1 relative overflow-hidden bg-neutral-950 flex items-center justify-center"
            style={{ cursor: pictureZoom > 1 && activeWheelId === null ? "grab" : undefined }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerDown={(e) => {
              if (pictureZoom > 1 && activeWheelId === null) {
                handleContainerPointerDown(e);
              }
            }}
            onClick={() => setActiveWheelId(null)}
          >
            {carImage && (
              <div
                className="relative"
                style={{
                  transform: `scale(${pictureZoom}) translate(${picturePan.x / pictureZoom}px, ${picturePan.y / pictureZoom}px)`,
                  transformOrigin: "center center",
                  transition: isPanning || isDragging ? "none" : "transform 0.2s ease",
                }}
              >
                <img
                  src={carImage}
                  alt="Your car"
                  className="max-w-full max-h-[calc(100vh-60px)] md:max-h-[calc(100vh-60px)] object-contain select-none pointer-events-none"
                  draggable={false}
                />
                {wheels.map((wheel) => (
                  <div
                    key={wheel.id}
                    className="absolute cursor-grab active:cursor-grabbing select-none touch-none"
                    style={{
                      left: `${wheel.x}%`,
                      top: `${wheel.y}%`,
                      transform: `translate(-50%, -50%) scale(${wheel.scale})`,
                      width: `${wheelBaseSize}px`,
                      height: `${wheelBaseSize}px`,
                      zIndex: activeWheelId === wheel.id ? 20 : 10,
                    }}
                    onPointerDown={(e) => handlePointerDown(e, wheel.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveWheelId(wheel.id);
                    }}
                  >
                    {brakeDiscUrl && (
                      <img
                        src={brakeDiscUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        draggable={false}
                        style={{ transform: "scale(1.02)" }}
                      />
                    )}
                    <img
                      src={coloredWheelUrl || croppedWheelUrl || wheelImageUrl}
                      alt="Wheel overlay"
                      className="relative w-full h-full object-contain pointer-events-none"
                      draggable={false}
                    />
                    {activeWheelId === wheel.id && (
                      <>
                        <div className="absolute inset-0 ring-2 ring-primary ring-offset-2 ring-offset-transparent rounded-full pointer-events-none" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeWheel(wheel.id);
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white z-30"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {pictureZoom > 1 && (
              <div className="absolute bottom-3 left-3 bg-black/70 text-white text-[10px] px-2 py-1 rounded pointer-events-none">
                {Math.round(pictureZoom * 100)}%
              </div>
            )}

            {activeWheelId !== null && (
              <div className="absolute bottom-4 left-4 md:hidden z-30 flex gap-2">
                <button
                  onClick={() => adjustScale(activeWheelId, -0.1)}
                  className="w-10 h-10 bg-black/80 border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                  data-testid="button-decrease-inch-mobile"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => adjustScale(activeWheelId, 0.1)}
                  className="w-10 h-10 bg-black/80 border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                  data-testid="button-increase-inch-mobile"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ── MOBILE BOTTOM TOOLBAR ── */}
          <div className="md:hidden bg-black border-t border-white/10 px-3 py-2 flex flex-col gap-2 shrink-0 max-h-[40vh] overflow-y-auto">
            <div className="flex gap-1.5">
              <button
                onClick={() => setShowBrakeDisc(!showBrakeDisc)}
                className={`flex-1 h-7 text-[9px] flex items-center justify-center gap-1 border active:scale-95 ${showBrakeDisc ? "border-primary/50 text-primary bg-primary/10" : "border-white/20 text-white bg-white/5"}`}
                data-testid="button-toggle-brake-disc-mobile"
              >
                <Disc className="w-3 h-3 shrink-0" />
                {t("product.visualizerBrakeDisc")}
                <span className={`text-[7px] ${showBrakeDisc ? "text-primary" : "text-white/40"}`}>{showBrakeDisc ? "ON" : "OFF"}</span>
              </button>
              <button
                onClick={() => { if (!showBrakeDisc && !showCaliper) setShowBrakeDisc(true); setShowCaliper(!showCaliper); }}
                className={`flex-1 h-7 text-[9px] flex items-center justify-center gap-1 border active:scale-95 ${showCaliper ? "border-red-500/50 text-red-400 bg-red-500/10" : "border-white/20 text-white bg-white/5"}`}
                data-testid="button-toggle-caliper-mobile"
              >
                <Disc className="w-3 h-3 shrink-0" />
                {t("product.visualizerCaliper")}
                <span className={`text-[7px] ${showCaliper ? "text-red-400" : "text-white/40"}`}>{showCaliper ? "ON" : "OFF"}</span>
              </button>
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                disabled={!croppedWheelUrl}
                className={`flex-1 h-7 text-[9px] flex items-center justify-center gap-1 border active:scale-95 disabled:opacity-30 ${showColorPicker ? "border-primary/50 text-primary bg-primary/10" : "border-white/20 text-white bg-white/5"}`}
                data-testid="button-toggle-color-picker-mobile"
              >
                <Palette className="w-3 h-3 shrink-0" />
                {t("product.visualizerColorWheel")}
              </button>
            </div>

            {showColorPicker && (
              <div className="flex flex-col gap-1.5 border border-white/10 p-2 bg-white/5">
                <div className="grid grid-cols-8 gap-1">
                  {presetColors.map((pc) => (
                    <button
                      key={pc.color}
                      title={pc.name}
                      onClick={() => applyColorToWheel(pc.color)}
                      className="w-full aspect-square border border-white/20 hover:border-primary transition-colors relative"
                      style={{ backgroundColor: pc.color }}
                      data-testid={`button-color-mobile-${pc.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {spokeColor === pc.color && (
                        <Check className="w-2.5 h-2.5 absolute inset-0 m-auto text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border border-white/20 shrink-0" style={{ backgroundColor: `hsl(${customHue}, ${customSat}%, ${customLight}%)` }} />
                  <input type="range" min="0" max="360" value={customHue} onChange={(e) => setCustomHue(Number(e.target.value))} className="flex-1 h-1 accent-primary" style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }} data-testid="slider-hue-mobile" />
                  <input type="range" min="0" max="100" value={customSat} onChange={(e) => setCustomSat(Number(e.target.value))} className="flex-1 h-1 accent-primary" data-testid="slider-saturation-mobile" />
                  <input type="range" min="5" max="95" value={customLight} onChange={(e) => setCustomLight(Number(e.target.value))} className="flex-1 h-1 accent-primary" data-testid="slider-lightness-mobile" />
                  <button
                    onClick={() => {
                      const hslToHex = (h: number, s: number, l: number) => { s /= 100; l /= 100; const a = s * Math.min(l, 1 - l); const f = (n: number) => { const k = (n + h / 30) % 12; const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * c).toString(16).padStart(2, "0"); }; return `#${f(0)}${f(8)}${f(4)}`; };
                      applyColorToWheel(hslToHex(customHue, customSat, customLight));
                    }}
                    className="h-6 px-2 bg-primary text-black text-[8px] font-bold active:scale-95"
                    data-testid="button-apply-custom-color-mobile"
                  >
                    {t("product.visualizerApplyColor")}
                  </button>
                </div>
                {spokeColor && (
                  <button onClick={clearColor} className="h-6 text-[9px] text-white/60 flex items-center gap-1 active:scale-95" data-testid="button-clear-color-mobile">
                    <RotateCcw className="w-3 h-3" /> {t("product.visualizerClearColor")}
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-1.5">
              {onAddToCart && (
                <Button
                  onClick={onAddToCart}
                  disabled={isAddingToCart}
                  className="flex-1 bg-primary text-black hover:bg-white font-bold uppercase tracking-wider h-9 text-[10px]"
                  data-testid="button-visualizer-add-to-cart-mobile"
                >
                  {isAddingToCart ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ShoppingBag className="w-3 h-3 mr-1" />}
                  {t('visualizer.addToCart')}{productPrice ? ` — ${productPrice}` : ''}
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleShare}
                disabled={isGenerating}
                className="flex-1 bg-primary text-black hover:bg-primary/90 h-9 text-[10px] font-bold uppercase tracking-wider"
                data-testid="button-share-mobile"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 mr-1 animate-spin shrink-0" /> : <Share2 className="w-3 h-3 mr-1 shrink-0" />}
                {isGenerating ? t("product.visualizerGenerating") : t("product.visualizerShare")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isGenerating}
                className="h-9 w-9 shrink-0 border-white/20 text-white hover:bg-white/10 p-0"
                data-testid="button-download-mobile"
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* ── DESKTOP SIDEBAR ── */}
          {showMenu && (
            <div className="hidden md:flex md:relative md:z-auto md:w-72 bg-black border-l border-white/10 overflow-y-auto shrink-0 flex-col">
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10 bg-neutral-900">
                    <img src={coloredWheelUrl || croppedWheelUrl || wheelImageUrl} alt={productTitle} className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white/40 text-[9px] uppercase tracking-widest">{t("product.visualizerSelectedWheel")}</p>
                    <p className="text-white text-xs font-medium truncate">{productTitle}</p>
                  </div>
                  <button onClick={() => setShowMenu(false)} className="text-white/40 hover:text-white p-1" data-testid="button-hide-panel">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {activeWheelId !== null && (
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => adjustScale(activeWheelId, -0.1)} className="flex-1 border-white/20 text-white hover:bg-white/10 h-8 text-[10px]" data-testid="button-decrease-inch">
                      <Minus className="w-3 h-3 mr-1 shrink-0" />{t("product.visualizerDecreaseInch")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => adjustScale(activeWheelId, 0.1)} className="flex-1 border-white/20 text-white hover:bg-white/10 h-8 text-[10px]" data-testid="button-increase-inch">
                      <Plus className="w-3 h-3 mr-1 shrink-0" />{t("product.visualizerIncreaseInch")}
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => adjustPictureZoom(-0.25)} disabled={pictureZoom <= 1} className="border-white/20 text-white hover:bg-white/10 h-8 text-[10px]" data-testid="button-picture-zoom-out">
                    <ZoomOut className="w-3 h-3 mr-1 shrink-0" />{t("product.visualizerZoomOut")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => adjustPictureZoom(0.25)} disabled={pictureZoom >= 5} className="border-white/20 text-white hover:bg-white/10 h-8 text-[10px]" data-testid="button-picture-zoom-in">
                    <ZoomIn className="w-3 h-3 mr-1 shrink-0" />{t("product.visualizerZoomIn")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={addWheel} className="border-white/20 text-white hover:bg-white/10 h-8 text-[10px]" data-testid="button-add-wheel">
                    <Plus className="w-3 h-3 mr-1 shrink-0" />{t("product.visualizerAddWheel")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetWheels} className="border-white/20 text-white hover:bg-white/10 h-8 text-[10px]" data-testid="button-reset-wheels">
                    <RotateCcw className="w-3 h-3 mr-1 shrink-0" />{t("product.visualizerReset")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setCarImage(null); setWheels([]); setCroppedWheelUrl(null); setCropCircle({ x: 50, y: 50, radius: 40 }); setPictureZoom(1); setPicturePan({ x: 0, y: 0 }); setStep("crop"); }} className="border-white/20 text-white hover:bg-white/10 h-8 text-[10px]" data-testid="button-recrop">
                    <CircleDot className="w-3 h-3 mr-1 shrink-0" />{t("product.visualizerRecrop")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setCarImage(null); setWheels([]); setPictureZoom(1); setPicturePan({ x: 0, y: 0 }); setStep("crop"); }} className="border-white/20 text-white hover:bg-white/10 h-8 text-[10px]" data-testid="button-change-photo">
                    <Upload className="w-3 h-3 mr-1 shrink-0" />{t("product.visualizerChangePhoto")}
                  </Button>
                </div>

                <div className="border-t border-white/10 pt-2">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest mb-1.5">{t("product.visualizerEffects")}</p>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => setShowBrakeDisc(!showBrakeDisc)} className={`flex-1 h-8 text-[10px] ${showBrakeDisc ? "border-primary/50 text-primary bg-primary/10 hover:bg-primary/20" : "border-white/20 text-white hover:bg-white/10"}`} data-testid="button-toggle-brake-disc">
                      <Disc className="w-3 h-3 mr-1 shrink-0" />{t("product.visualizerBrakeDisc")}
                      <span className={`ml-auto text-[8px] ${showBrakeDisc ? "text-primary" : "text-white/40"}`}>{showBrakeDisc ? "ON" : "OFF"}</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { if (!showBrakeDisc && !showCaliper) setShowBrakeDisc(true); setShowCaliper(!showCaliper); }} className={`flex-1 h-8 text-[10px] ${showCaliper ? "border-red-500/50 text-red-400 bg-red-500/10 hover:bg-red-500/20" : "border-white/20 text-white hover:bg-white/10"}`} data-testid="button-toggle-caliper">
                      <Disc className="w-3 h-3 mr-1 shrink-0" />{t("product.visualizerCaliper")}
                      <span className={`ml-auto text-[8px] ${showCaliper ? "text-red-400" : "text-white/40"}`}>{showCaliper ? "ON" : "OFF"}</span>
                    </Button>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-2">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest mb-1.5">{t("product.visualizerColorSection")}</p>
                  <Button variant="outline" size="sm" onClick={() => setShowColorPicker(!showColorPicker)} disabled={!croppedWheelUrl} className={`w-full h-8 text-[10px] justify-start ${showColorPicker ? "border-primary/50 text-primary bg-primary/10 hover:bg-primary/20" : "border-white/20 text-white hover:bg-white/10"}`} data-testid="button-toggle-color-picker">
                    <Palette className="w-3 h-3 mr-2 shrink-0" />{t("product.visualizerColorWheel")}
                    <span className={`ml-auto text-[8px] ${showColorPicker ? "text-primary" : "text-white/40"}`}>{showColorPicker ? "ON" : "OFF"}</span>
                  </Button>
                  {showColorPicker && (
                    <div className="flex flex-col gap-2 pt-2">
                      <div className="grid grid-cols-6 gap-1.5">
                        {presetColors.map((pc) => (
                          <button key={pc.color} title={pc.name} onClick={() => applyColorToWheel(pc.color)} className="w-full aspect-square border border-white/20 hover:border-primary transition-colors relative" style={{ backgroundColor: pc.color }} data-testid={`button-color-${pc.name.toLowerCase().replace(/\s+/g, "-")}`}>
                            {spokeColor === pc.color && <Check className="w-3 h-3 absolute inset-0 m-auto text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-col gap-1.5 pt-1">
                        <p className="text-white/30 text-[8px] uppercase tracking-widest">{t("product.visualizerCustomColor")}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 border border-white/20 shrink-0" style={{ backgroundColor: `hsl(${customHue}, ${customSat}%, ${customLight}%)` }} />
                          <Button variant="outline" size="sm" onClick={() => { const hslToHex = (h: number, s: number, l: number) => { s /= 100; l /= 100; const a = s * Math.min(l, 1 - l); const f = (n: number) => { const k = (n + h / 30) % 12; const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * c).toString(16).padStart(2, "0"); }; return `#${f(0)}${f(8)}${f(4)}`; }; applyColorToWheel(hslToHex(customHue, customSat, customLight)); }} className="flex-1 border-white/20 text-white hover:bg-white/10 h-7 text-[9px]" data-testid="button-apply-custom-color">
                            {t("product.visualizerApplyColor")}
                          </Button>
                        </div>
                        <label className="flex items-center gap-2"><span className="text-white/40 text-[8px] w-7 shrink-0">{t("product.visualizerHue")}</span><input type="range" min="0" max="360" value={customHue} onChange={(e) => setCustomHue(Number(e.target.value))} className="flex-1 h-1.5 accent-primary" style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }} data-testid="slider-hue" /></label>
                        <label className="flex items-center gap-2"><span className="text-white/40 text-[8px] w-7 shrink-0">{t("product.visualizerSat")}</span><input type="range" min="0" max="100" value={customSat} onChange={(e) => setCustomSat(Number(e.target.value))} className="flex-1 h-1.5 accent-primary" data-testid="slider-saturation" /></label>
                        <label className="flex items-center gap-2"><span className="text-white/40 text-[8px] w-7 shrink-0">{t("product.visualizerLit")}</span><input type="range" min="5" max="95" value={customLight} onChange={(e) => setCustomLight(Number(e.target.value))} className="flex-1 h-1.5 accent-primary" data-testid="slider-lightness" /></label>
                      </div>
                      {spokeColor && (
                        <Button variant="outline" size="sm" onClick={clearColor} className="w-full border-white/20 text-white hover:bg-white/10 h-8 text-[10px] justify-start" data-testid="button-clear-color">
                          <RotateCcw className="w-3 h-3 mr-2 shrink-0" />{t("product.visualizerClearColor")}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {onAddToCart && (
                  <div className="border-t border-white/10 pt-2">
                    <Button onClick={onAddToCart} disabled={isAddingToCart} className="w-full bg-primary text-black hover:bg-white font-bold uppercase tracking-wider h-10 text-xs" data-testid="button-visualizer-add-to-cart">
                      {isAddingToCart ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingBag className="w-4 h-4 mr-2" />}
                      {t('visualizer.addToCart')}{productPrice ? ` — ${productPrice}` : ''}
                    </Button>
                  </div>
                )}

                <div className="border-t border-white/10 pt-2 flex gap-1.5">
                  <Button size="sm" onClick={handleShare} disabled={isGenerating} className="flex-1 bg-primary text-black hover:bg-primary/90 h-9 text-[10px] font-bold uppercase tracking-wider" data-testid="button-share">
                    {isGenerating ? <Loader2 className="w-3 h-3 mr-1 animate-spin shrink-0" /> : <Share2 className="w-3 h-3 mr-1 shrink-0" />}
                    {isGenerating ? t("product.visualizerGenerating") : t("product.visualizerShare")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload} disabled={isGenerating} className="flex-1 border-white/20 text-white hover:bg-white/10 h-9 text-[10px] font-bold uppercase tracking-wider" data-testid="button-download">
                    <Download className="w-3 h-3 mr-1 shrink-0" />{t("product.visualizerDownload")}
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-white/30 text-[10px] pt-1 border-t border-white/10">
                  <Move className="w-3 h-3" />
                  <span>{t("product.visualizerDragHint")}</span>
                </div>
              </div>
            </div>
          )}

          {!showMenu && (
            <button
              onClick={() => setShowMenu(true)}
              className="hidden md:flex absolute top-4 right-4 z-30 items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-3 py-2 hover:bg-white/20 transition-colors"
              data-testid="button-show-panel-desktop"
            >
              <Settings2 className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest font-bold">{t("product.visualizerCustomize")}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
