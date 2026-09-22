import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "31611601627";
const WHATSAPP_MESSAGE = "Hi Juju Wheels! I have a question about your wheels.";

export function WhatsAppButton() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-16 right-6 z-50 flex items-center justify-center w-14 h-14 bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:shadow-[0_4px_28px_rgba(233,211,85,0.5)] hover:bg-primary hover:scale-110 active:scale-95 transition-all duration-200"
      data-testid="button-whatsapp-chat"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-6 h-6 group-hover:rotate-[8deg] transition-transform duration-200" />
    </a>
  );
}
