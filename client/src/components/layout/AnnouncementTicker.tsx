const ITEMS = [
  { tag: "NEW", text: "Wheel Visualizer — upload your photo and preview wheels on your own car" },
  { tag: "NEW STOCK", text: "Spinners now available — animated JDM split-spoke designs" },
  { tag: "NEW STOCK", text: "Weds Kranze, Work Wheels & SSR just added to the catalogue" },
  { tag: "NEW", text: "BC Racing Coilovers — free fitment advice, order direct via WhatsApp" },
  { tag: "NEW STOCK", text: "StanceParts cups and urethane hardware now in stock" },
  { tag: "NEW", text: "3-Piece Spec Calculator — configure width, offset and dish cross-section" },
  { tag: "NEW", text: "Spacer & Adapter Configurator — PCD, thread spec and custom notes" },
  { tag: "NEW", text: "My Garage — save your vehicles and browse compatible wheels" },
  { tag: "NEW", text: "Wheel Fitment Calculator — compare tyre setups with visual diagrams" },
  { tag: "NEW", text: "Vehicle Fitment Checker — find every wheel that fits your car" },
];

const SEP = "◆";

export function AnnouncementTicker() {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <>
      <style>{`
        @keyframes juju-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .juju-ticker-track {
          animation: juju-ticker 60s linear infinite;
          will-change: transform;
        }
        .juju-ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div
        className="relative overflow-hidden border-b border-white/[0.07] bg-black h-8 flex items-center z-40"
        aria-hidden="true"
      >
        <div className="juju-ticker-track flex items-center whitespace-nowrap">
          {doubled.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-3 px-6 shrink-0">
              <span className="font-tech text-[9px] font-bold uppercase tracking-[0.25em] text-primary">
                {item.tag}
              </span>
              <span className="font-tech text-[10px] uppercase tracking-[0.15em] text-white/40">
                {item.text}
              </span>
              <span className="text-white/15 text-[8px]">{SEP}</span>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
