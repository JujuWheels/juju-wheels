import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { SEO } from "@/components/SEO";

interface WheelSetup {
  diameter: number;
  width: number;
  offset: number;
  tyreWidth: number;
  tyreProfile: number;
}

interface CalcResults {
  overallDiameter: number;
  circumference: number;
  poke: number;
  inset: number;
  sidewallHeight: number;
  wheelWidthMm: number;
}

function calculate(setup: WheelSetup): CalcResults {
  const nominalSidewall = setup.tyreWidth * (setup.tyreProfile / 100);
  const wheelDiameterMm = setup.diameter * 25.4;
  const wheelWidthMm = setup.width * 25.4;
  const d = (setup.tyreWidth - wheelWidthMm) / 2;
  const sidewallHeight = Math.sqrt(nominalSidewall * nominalSidewall - d * d);
  const overallDiameter = wheelDiameterMm + 2 * sidewallHeight;
  const circumference = Math.PI * overallDiameter;
  const halfWidth = wheelWidthMm / 2;
  const poke = halfWidth - setup.offset;
  const inset = halfWidth + setup.offset;
  return { overallDiameter, circumference, poke, inset, sidewallHeight, wheelWidthMm };
}

function InputField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  id,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit: string;
  id: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs uppercase tracking-wider text-white/60 font-tech">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v) && v >= min && v <= max) onChange(v);
          }}
          min={min}
          max={max}
          step={step}
          className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary transition-colors"
          data-testid={`input-${id}`}
        />
        <span className="text-xs text-white/40 min-w-[30px]">{unit}</span>
      </div>
    </div>
  );
}

function SetupInputs({
  setup,
  onChange,
  prefix,
  color,
  title,
  labels,
}: {
  setup: WheelSetup;
  onChange: (s: WheelSetup) => void;
  prefix: string;
  color: string;
  title: string;
  labels: { wheel: string; tyre: string; diameter: string; width: string; offset: string; tyreWidth: string; profile: string };
}) {
  return (
    <div className="flex-1 min-w-[280px]">
      <h3 className="font-tech uppercase tracking-wider text-lg mb-4" style={{ color }}>
        {title}
      </h3>
      <div className="border border-white/10 p-4 space-y-4 bg-white/[0.02]">
        <h4 className="text-xs uppercase tracking-widest text-white/40 font-tech border-b border-white/10 pb-2">
          {labels.wheel}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <InputField label={labels.diameter} value={setup.diameter} onChange={(v) => onChange({ ...setup, diameter: v })} min={10} max={30} unit="in" id={`${prefix}-diameter`} />
          <InputField label={labels.width} value={setup.width} onChange={(v) => onChange({ ...setup, width: v })} min={3} max={16} step={0.5} unit="in" id={`${prefix}-width`} />
        </div>
        <InputField label={labels.offset} value={setup.offset} onChange={(v) => onChange({ ...setup, offset: v })} min={-70} max={70} unit="mm" id={`${prefix}-offset`} />
        <h4 className="text-xs uppercase tracking-widest text-white/40 font-tech border-b border-white/10 pb-2 pt-2">
          {labels.tyre}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <InputField label={labels.tyreWidth} value={setup.tyreWidth} onChange={(v) => onChange({ ...setup, tyreWidth: v })} min={105} max={395} step={5} unit="mm" id={`${prefix}-tyre-width`} />
          <InputField label={labels.profile} value={setup.tyreProfile} onChange={(v) => onChange({ ...setup, tyreProfile: v })} min={20} max={100} unit="%" id={`${prefix}-tyre-profile`} />
        </div>
      </div>
    </div>
  );
}

function ResultRow({ label, existing, newVal, unit = "mm", highlight = false }: { label: string; existing: string; newVal: string; unit?: string; highlight?: boolean }) {
  return (
    <div className={`grid grid-cols-3 gap-4 py-3 border-b border-white/5 ${highlight ? "bg-primary/5" : ""}`}>
      <div className="text-sm text-white/60 font-tech uppercase tracking-wider">{label}</div>
      <div className="text-sm text-white/80 font-mono text-center">{existing}{unit && ` ${unit}`}</div>
      <div className="text-sm text-primary font-mono text-center font-bold">{newVal}{unit && ` ${unit}`}</div>
    </div>
  );
}

function drawDiagram(
  canvas: HTMLCanvasElement,
  existing: WheelSetup,
  newSetup: WheelSetup,
  existingResults: CalcResults,
  newResults: CalcResults
) {
  const ctx = canvas.getContext("2d")!;
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  const W = rect.width;
  const H = rect.height;

  ctx.clearRect(0, 0, W, H);

  const existingColor = "#FF6B00";
  const newColor = "#00AAFF";
  const tyreColor = "#1a1a1a";

  const s = Math.min(W / 500, H / 600) * 0.85;
  const hubX = W / 2;
  const hubY = H / 2 + 15 * s;

  function toScale(mm: number) { return mm * s * 0.45; }

  function drawTyreAndWheel(
    c: CanvasRenderingContext2D,
    setup: WheelSetup,
    results: CalcResults,
    color: string,
    isFilled: boolean
  ) {
    const halfOD = toScale(results.overallDiameter / 2);
    const wheelR = toScale((setup.diameter * 25.4) / 2);
    const halfW = toScale(results.wheelWidthMm / 2);
    const offPx = toScale(setup.offset);
    const sw = toScale(results.sidewallHeight);
    const tyreW = toScale(setup.tyreWidth);

    const innerRimX = hubX - (halfW + offPx);
    const outerRimX = hubX + (halfW - offPx);
    const innerTyreX = hubX - (tyreW / 2 + offPx);
    const outerTyreX = hubX + (tyreW / 2 - offPx);

    const rimThick = 3 * s;
    const lipH = 8 * s;
    const beadR = 4 * s;

    if (isFilled) {
      c.fillStyle = tyreColor;
      const tR = beadR;
      c.beginPath();
      c.moveTo(outerTyreX - tR, hubY - halfOD);
      c.lineTo(innerTyreX + tR, hubY - halfOD);
      c.quadraticCurveTo(innerTyreX, hubY - halfOD, innerTyreX, hubY - halfOD + tR);
      c.lineTo(innerTyreX, hubY - wheelR - lipH);
      c.lineTo(innerRimX, hubY - wheelR - lipH);
      c.lineTo(innerRimX, hubY - wheelR);
      c.lineTo(innerRimX, hubY + wheelR);
      c.lineTo(innerRimX, hubY + wheelR + lipH);
      c.lineTo(innerTyreX, hubY + wheelR + lipH);
      c.lineTo(innerTyreX, hubY + halfOD - tR);
      c.quadraticCurveTo(innerTyreX, hubY + halfOD, innerTyreX + tR, hubY + halfOD);
      c.lineTo(outerTyreX - tR, hubY + halfOD);
      c.quadraticCurveTo(outerTyreX, hubY + halfOD, outerTyreX, hubY + halfOD - tR);
      c.lineTo(outerTyreX, hubY + wheelR + lipH);
      c.lineTo(outerRimX, hubY + wheelR + lipH);
      c.lineTo(outerRimX, hubY + wheelR);
      c.lineTo(outerRimX, hubY - wheelR);
      c.lineTo(outerRimX, hubY - wheelR - lipH);
      c.lineTo(outerTyreX, hubY - wheelR - lipH);
      c.lineTo(outerTyreX, hubY - halfOD + tR);
      c.quadraticCurveTo(outerTyreX, hubY - halfOD, outerTyreX - tR, hubY - halfOD);
      c.closePath();
      c.fill();
    }

    c.strokeStyle = color;
    c.lineWidth = isFilled ? 2.5 : 2;
    c.setLineDash([]);

    const tR = beadR;
    c.beginPath();
    c.moveTo(outerTyreX - tR, hubY - halfOD);
    c.lineTo(innerTyreX + tR, hubY - halfOD);
    c.quadraticCurveTo(innerTyreX, hubY - halfOD, innerTyreX, hubY - halfOD + tR);
    c.lineTo(innerTyreX, hubY - wheelR - lipH);
    c.stroke();
    c.beginPath();
    c.moveTo(innerTyreX, hubY + wheelR + lipH);
    c.lineTo(innerTyreX, hubY + halfOD - tR);
    c.quadraticCurveTo(innerTyreX, hubY + halfOD, innerTyreX + tR, hubY + halfOD);
    c.lineTo(outerTyreX - tR, hubY + halfOD);
    c.quadraticCurveTo(outerTyreX, hubY + halfOD, outerTyreX, hubY + halfOD - tR);
    c.lineTo(outerTyreX, hubY + wheelR + lipH);
    c.stroke();
    c.beginPath();
    c.moveTo(outerTyreX, hubY - wheelR - lipH);
    c.lineTo(outerTyreX, hubY - halfOD + tR);
    c.quadraticCurveTo(outerTyreX, hubY - halfOD, outerTyreX - tR, hubY - halfOD);
    c.stroke();

    c.lineWidth = isFilled ? 3 : 2;
    c.beginPath();
    c.moveTo(innerRimX, hubY - wheelR - lipH);
    c.lineTo(innerTyreX, hubY - wheelR - lipH);
    c.stroke();
    c.beginPath();
    c.moveTo(innerRimX, hubY + wheelR + lipH);
    c.lineTo(innerTyreX, hubY + wheelR + lipH);
    c.stroke();
    c.beginPath();
    c.moveTo(outerRimX, hubY - wheelR - lipH);
    c.lineTo(outerTyreX, hubY - wheelR - lipH);
    c.stroke();
    c.beginPath();
    c.moveTo(outerRimX, hubY + wheelR + lipH);
    c.lineTo(outerTyreX, hubY + wheelR + lipH);
    c.stroke();

    c.lineWidth = rimThick;
    c.beginPath();
    c.moveTo(innerRimX, hubY - wheelR - lipH);
    c.lineTo(innerRimX, hubY + wheelR + lipH);
    c.stroke();
    c.beginPath();
    c.moveTo(outerRimX, hubY - wheelR - lipH);
    c.lineTo(outerRimX, hubY + wheelR + lipH);
    c.stroke();

    return { innerRimX, outerRimX };
  }

  function drawStrutAssembly(c: CanvasRenderingContext2D) {
    const sx = hubX - toScale(70);
    const u = s;

    const topBoltTop = hubY - 230 * u;
    const topBoltBot = hubY - 210 * u;
    const topMountTop = topBoltBot;
    const topMountBot = topMountTop + 18 * u;
    const upperPlateTop = topMountBot;
    const upperPlateBot = upperPlateTop + 8 * u;
    const springTop = upperPlateBot + 2 * u;
    const springBot = hubY - 45 * u;
    const damperBodyTop = springBot - 10 * u;
    const damperBodyBot = hubY + 20 * u;
    const knuckleTop = damperBodyBot;
    const knuckleBot = hubY + 75 * u;

    c.fillStyle = "#4a4a4a";
    c.strokeStyle = "#777";
    c.lineWidth = 1.5;
    const boltW = 5 * u;
    c.fillRect(sx - boltW / 2, topBoltTop, boltW, topBoltBot - topBoltTop);
    c.strokeRect(sx - boltW / 2, topBoltTop, boltW, topBoltBot - topBoltTop);

    c.fillStyle = "#3a3a3a";
    const nutW = 10 * u;
    const nutH = 6 * u;
    c.fillRect(sx - nutW / 2, topBoltTop - nutH, nutW, nutH);
    c.strokeRect(sx - nutW / 2, topBoltTop - nutH, nutW, nutH);

    c.fillStyle = "#555";
    const mountW = 32 * u;
    c.beginPath();
    c.moveTo(sx - mountW / 2, topMountBot);
    c.lineTo(sx - mountW / 2 - 4 * u, topMountTop);
    c.lineTo(sx + mountW / 2 + 4 * u, topMountTop);
    c.lineTo(sx + mountW / 2, topMountBot);
    c.closePath();
    c.fill();
    c.stroke();

    c.fillStyle = "#4a4a4a";
    const plateW = 38 * u;
    c.fillRect(sx - plateW / 2, upperPlateTop, plateW, upperPlateBot - upperPlateTop);
    c.strokeRect(sx - plateW / 2, upperPlateTop, plateW, upperPlateBot - upperPlateTop);

    const shaftW = 6 * u;
    c.fillStyle = "#666";
    c.fillRect(sx - shaftW / 2, springTop, shaftW, springBot - springTop + 20 * u);
    c.strokeRect(sx - shaftW / 2, springTop, shaftW, springBot - springTop + 20 * u);

    const springW = 36 * u;
    const coils = 10;
    const springH = springBot - springTop;
    const coilSpacing = springH / coils;
    c.lineWidth = 3.5 * u;
    c.lineCap = "round";

    for (let i = 0; i < coils; i++) {
      const y = springTop + i * coilSpacing;
      const nextY = y + coilSpacing;

      c.strokeStyle = "#888";
      c.beginPath();
      c.moveTo(sx - springW / 2, y);
      c.lineTo(sx + springW / 2, y + coilSpacing * 0.5);
      c.stroke();

      c.strokeStyle = "#666";
      c.beginPath();
      c.moveTo(sx + springW / 2, y + coilSpacing * 0.5);
      c.lineTo(sx - springW / 2, nextY);
      c.stroke();
    }
    c.lineCap = "butt";

    c.fillStyle = "#555";
    c.strokeStyle = "#777";
    c.lineWidth = 1.5;
    const bodyW = 24 * u;
    c.fillRect(sx - bodyW / 2, damperBodyTop, bodyW, damperBodyBot - damperBodyTop);
    c.strokeRect(sx - bodyW / 2, damperBodyTop, bodyW, damperBodyBot - damperBodyTop);

    c.fillStyle = "#666";
    const flangeW = bodyW + 8 * u;
    c.fillRect(sx - flangeW / 2, damperBodyTop, flangeW, 6 * u);
    c.strokeRect(sx - flangeW / 2, damperBodyTop, flangeW, 6 * u);
    c.fillRect(sx - flangeW / 2, damperBodyBot - 6 * u, flangeW, 6 * u);
    c.strokeRect(sx - flangeW / 2, damperBodyBot - 6 * u, flangeW, 6 * u);

    c.fillStyle = "#4a4a4a";
    const kW = 28 * u;
    c.beginPath();
    c.moveTo(sx - kW / 2, knuckleTop);
    c.lineTo(sx - kW / 2 - 5 * u, knuckleBot);
    c.lineTo(sx + kW / 2 + 5 * u, knuckleBot);
    c.lineTo(sx + kW / 2, knuckleTop);
    c.closePath();
    c.fill();
    c.stroke();

    c.fillStyle = "#3a3a3a";
    const brkW = kW + 14 * u;
    const brkH = 20 * u;
    const brkY = hubY - brkH / 2;
    c.fillRect(sx + kW / 2 - 2 * u, brkY, brkW / 2, brkH);
    c.strokeRect(sx + kW / 2 - 2 * u, brkY, brkW / 2, brkH);

    c.fillStyle = "#666";
    c.strokeStyle = "#888";
    c.lineWidth = 1.5;
    const axleStartX = sx + kW / 2 + brkW / 2 - 2 * u;
    const axleEndX = hubX;
    const axleH = 8 * u;
    c.fillRect(axleStartX, hubY - axleH / 2, axleEndX - axleStartX, axleH);
    c.strokeRect(axleStartX, hubY - axleH / 2, axleEndX - axleStartX, axleH);

    c.fillStyle = "#777";
    c.strokeStyle = "#999";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(hubX, hubY, 12 * u, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    c.fillStyle = "#555";
    c.beginPath();
    c.arc(hubX, hubY, 5 * u, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#777";
    c.lineWidth = 1;
    c.stroke();

    const studs = 4;
    const studR = 8 * u;
    for (let i = 0; i < studs; i++) {
      const angle = (i / studs) * Math.PI * 2 - Math.PI / 4;
      const stX = hubX + Math.cos(angle) * studR;
      const stY = hubY + Math.sin(angle) * studR;
      c.fillStyle = "#888";
      c.beginPath();
      c.arc(stX, stY, 2 * u, 0, Math.PI * 2);
      c.fill();
    }
  }

  drawStrutAssembly(ctx);

  drawTyreAndWheel(ctx, existing, existingResults, existingColor, true);
  drawTyreAndWheel(ctx, newSetup, newResults, newColor, false);

  const strutX = hubX - toScale(70);
  const insideLabelX = (strutX + hubX) / 2 - 10;
  const outsideLabelX = hubX + toScale(120);
  const indicatorY = 42;

  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText("◄ INSIDE", insideLabelX, indicatorY);
  ctx.fillText("OUTSIDE ►", outsideLabelX, indicatorY);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(hubX, indicatorY + 6);
  ctx.lineTo(hubX, H - 30);
  ctx.stroke();
  ctx.setLineDash([]);

  const pad = 10;
  const labelY = 18;

  ctx.font = "bold 11px monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = existingColor;
  ctx.fillText(`■ EXISTING: ${existing.diameter}x${existing.width} ET${existing.offset} – ${existing.tyreWidth}/${existing.tyreProfile} R${existing.diameter}`, pad, H - pad);

  ctx.fillStyle = newColor;
  ctx.fillText(`■ NEW: ${newSetup.diameter}x${newSetup.width} ET${newSetup.offset} – ${newSetup.tyreWidth}/${newSetup.tyreProfile} R${newSetup.diameter}`, pad, labelY);

  const pokeDiff = newResults.poke - existingResults.poke;
  const insetDiff = newResults.inset - existingResults.inset;
  ctx.font = "10px monospace";
  ctx.textAlign = "right";
  if (pokeDiff !== 0) {
    ctx.fillStyle = pokeDiff > 0 ? "#F59E0B" : "#22C55E";
    ctx.fillText(`Poke: ${pokeDiff > 0 ? "+" : ""}${pokeDiff.toFixed(1)}mm`, W - pad, labelY);
  }
  if (insetDiff !== 0) {
    ctx.fillStyle = insetDiff > 0 ? "#EF4444" : "#22C55E";
    ctx.fillText(`Inset: ${insetDiff > 0 ? "+" : ""}${insetDiff.toFixed(1)}mm`, W - pad, labelY + 16);
  }
}

export default function FitmentCalculator() {
  const { t } = useLanguage();

  const parseFromUrl = (): WheelSetup => {
    if (typeof window === "undefined") return { diameter: 15, width: 7, offset: 35, tyreWidth: 195, tyreProfile: 50 };
    const params = new URLSearchParams(window.location.search);
    return {
      diameter: parseFloat(params.get("diameter") || "") || 15,
      width: parseFloat(params.get("width") || "") || 7,
      offset: parseFloat(params.get("offset") || "") || 35,
      tyreWidth: parseFloat(params.get("tyreWidth") || "") || 195,
      tyreProfile: parseFloat(params.get("tyreProfile") || "") || 50,
    };
  };

  const [existing, setExisting] = useState<WheelSetup>(parseFromUrl);

  useEffect(() => {
    if (window.location.search) {
      setExisting(parseFromUrl());
    }
  }, [window.location.search]);

  const [newSetup, setNewSetup] = useState<WheelSetup>({
    diameter: 17,
    width: 8,
    offset: 35,
    tyreWidth: 215,
    tyreProfile: 40,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const existingResults = calculate(existing);
  const newResults = calculate(newSetup);

  const speedoError = ((existingResults.circumference / newResults.circumference) - 1) * 100;
  const speedAt30 = 30 * (existingResults.circumference / newResults.circumference);
  const speedAt60 = 60 * (existingResults.circumference / newResults.circumference);
  const rideHeightChange = (newResults.overallDiameter - existingResults.overallDiameter) / 2;
  const pokeDiff = newResults.poke - existingResults.poke;
  const insetDiff = newResults.inset - existingResults.inset;

  const redraw = useCallback(() => {
    if (canvasRef.current) {
      drawDiagram(canvasRef.current, existing, newSetup, existingResults, newResults);
    }
  }, [existing, newSetup, existingResults, newResults]);

  useEffect(() => {
    redraw();
    window.addEventListener("resize", redraw);
    return () => window.removeEventListener("resize", redraw);
  }, [redraw]);

  const inputLabels = {
    wheel: t('calc.wheel'),
    tyre: t('calc.tyre'),
    diameter: t('calc.diameter'),
    width: t('calc.width'),
    offset: t('calc.offset'),
    tyreWidth: t('calc.tyreWidth'),
    profile: t('calc.profile'),
  };

  return (
    <div className="min-h-screen bg-background pt-28 pb-16">
      <SEO
        title="Wheel Fitment Calculator | Compare Wheel & Tyre Setups"
        description="Compare your existing vs new wheel and tyre setup side by side. Calculate overall diameter, speedometer error, stance difference and more. Free tool by Juju Wheels."
      />
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-display uppercase tracking-tight text-white mb-3" data-testid="text-calculator-title">
            {t('calc.title')}
          </h1>
          <p className="text-white/50 text-sm max-w-xl mx-auto">
            {t('calc.subtitle')}
          </p>
        </div>


        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <SetupInputs
            setup={existing}
            onChange={setExisting}
            prefix="existing"
            color="rgba(255,255,255,0.7)"
            title={t('calc.existingSetup')}
            labels={inputLabels}
          />
          <SetupInputs
            setup={newSetup}
            onChange={setNewSetup}
            prefix="new"
            color="#E9D355"
            title={t('calc.newSetup')}
            labels={inputLabels}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="border border-white/10 bg-white/[0.02] p-1">
            <canvas
              ref={canvasRef}
              className="w-full"
              style={{ height: "580px" }}
              data-testid="canvas-diagram"
            />
          </div>

          <div className="border border-white/10 bg-white/[0.02]">
            <div className="grid grid-cols-3 gap-4 py-3 px-4 border-b border-white/10 bg-white/5">
              <div className="text-xs uppercase tracking-widest text-white/40 font-tech">{t('calc.measurement')}</div>
              <div className="text-xs uppercase tracking-widest text-white/40 font-tech text-center">{t('calc.existing')}</div>
              <div className="text-xs uppercase tracking-widest text-primary/80 font-tech text-center">{t('calc.new')}</div>
            </div>
            <div className="px-4">
              <ResultRow
                label={t('calc.diameter')}
                existing={Math.round(existingResults.overallDiameter).toString()}
                newVal={Math.round(newResults.overallDiameter).toString()}
              />
              <ResultRow
                label={t('calc.circumference')}
                existing={Math.round(existingResults.circumference).toString()}
                newVal={Math.round(newResults.circumference).toString()}
              />
              <ResultRow
                label={t('calc.poke')}
                existing={Math.round(existingResults.poke).toString()}
                newVal={Math.round(newResults.poke).toString()}
                highlight
              />
              <ResultRow
                label={t('calc.inset')}
                existing={Math.round(existingResults.inset).toString()}
                newVal={Math.round(newResults.inset).toString()}
                highlight
              />
              <ResultRow
                label={t('calc.speedoError')}
                existing="0"
                newVal={speedoError.toFixed(1)}
                unit="%"
              />
              <ResultRow
                label={t('calc.readingAt30')}
                existing="30"
                newVal={parseFloat(speedAt30.toFixed(1)).toString()}
                unit="mph"
              />
              <ResultRow
                label={t('calc.readingAt60')}
                existing="60"
                newVal={parseFloat(speedAt60.toFixed(1)).toString()}
                unit="mph"
              />
              <ResultRow
                label={t('calc.rideHeightGain')}
                existing="0"
                newVal={Math.round(rideHeightChange).toString()}
                highlight
              />
              <ResultRow
                label={t('calc.archGapLoss')}
                existing="0"
                newVal={Math.round(rideHeightChange).toString()}
                highlight
              />
            </div>
          </div>
        </div>

        <div className="border border-white/10 bg-white/[0.02] p-6 space-y-3">
          <h3 className="font-tech uppercase tracking-wider text-primary text-sm">{t('calc.summary')}</h3>
          <p className="text-white/70 text-sm leading-relaxed">
            {t('calc.comparedToExisting')}{" "}
            <span className="text-white font-bold">
              {Math.abs(insetDiff).toFixed(1)}mm {insetDiff > 0 ? t('calc.innerRimCloser') : t('calc.innerRimFurther')} {t('calc.suspensionStrut')}
            </span>
            {" "}{t('calc.outerRimPoke')}{" "}
            <span className="text-white font-bold">
              {Math.abs(pokeDiff).toFixed(1)}mm {pokeDiff > 0 ? t('calc.moreThanBefore') : t('calc.lessThanBefore')}
            </span>
          </p>
          <p className="text-white/50 text-xs mt-2">
            {t('calc.strutNote')}
          </p>
          <p className="text-white/50 text-xs">
            {t('calc.tyreNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
