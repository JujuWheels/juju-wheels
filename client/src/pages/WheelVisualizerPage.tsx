import { useState, useRef } from "react";
import { Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language";
import WheelVisualizer from "@/components/WheelVisualizer";
import { SEO } from "@/components/SEO";

export default function WheelVisualizerPage() {
  const { t } = useLanguage();
  const [wheelImage, setWheelImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setWheelImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (wheelImage) {
    return (
      <WheelVisualizer
        wheelImageUrl={wheelImage}
        productTitle={t('visualizer.title')}
        onClose={() => setWheelImage(null)}
        isLocalImage
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <SEO
        title="Wheel Visualizer | Preview Colours & Finishes Online"
        description="Upload a photo of your car and preview different JDM wheel colours and finishes before you buy. Free online wheel visualizer by Juju Wheels."
      />
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <ImageIcon className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-display uppercase text-white mb-3" data-testid="text-visualizer-heading">
            {t('visualizer.title')}
          </h1>
          <p className="text-white/50 text-sm font-tech" data-testid="text-visualizer-desc">
            {t('visualizer.uploadDesc')}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          data-testid="input-wheel-upload"
        />

        <Button
          onClick={() => fileInputRef.current?.click()}
          className="bg-primary text-black hover:bg-white font-tech uppercase tracking-widest text-sm font-bold px-8 py-6 rounded-none"
          data-testid="button-upload-wheel"
        >
          <Upload className="w-5 h-5 mr-3" />
          {t('visualizer.uploadWheel')}
        </Button>

        <p className="text-white/30 text-xs font-tech mt-6">
          {t('visualizer.tip')}
        </p>
      </div>
    </div>
  );
}
