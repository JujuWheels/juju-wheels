export interface ModelStory {
  name: string;
  keywords: string[];
  era: string;
  construction: string;
  story: string;
}

export interface BrandStory {
  brand: string;
  keywords: string[];
  founded: number;
  country: string;
  city: string;
  founders?: string;
  logo?: string;
  story: string;
  models: ModelStory[];
}

export const brandStories: BrandStory[] = [
  {
    brand: "Work",
    keywords: ["work"],
    founded: 1977,
    country: "Japan",
    city: "Higashiosaka, Osaka",
    founders: "Takeshi Tanaka",
    logo: "/images/brands/work.png",
    story: "Founded in 1977 by Takeshi Tanaka in Higashiosaka, Osaka, Work Wheels began with a philosophy rooted in its name: \"If you work hard, anything can be achieved.\" Starting with the iconic Equip line and a dedicated 3-piece wheel factory, Work quickly became one of Japan's most respected aftermarket wheel manufacturers. With decades of motorsport involvement through Team Equip, they have built an unmatched reputation for precision engineering and aggressive fitments that define JDM wheel culture.",
    models: [
      {
        name: "Equip M1",
        keywords: ["equip m1", "equip-m1", "meister m1"],
        era: "2014–present",
        construction: "3-Piece Forged",
        story: "The Work Equip M1, part of the Meister series, is a 3-piece forged wheel that became synonymous with aggressive wide-body builds. Launched in 2014, its multi-spoke design and extreme width options made it a favorite for RWB Porsche builds and wide-body JDM platforms. The M1 carries forward the legacy of the original Equip line that launched Work Wheels in 1977.",
      },
      {
        name: "Emotion XT7",
        keywords: ["emotion xt7", "emotion-xt7"],
        era: "2000s–present",
        construction: "1-Piece Cast",
        story: "The Work Emotion XT7 is a lightweight 1-piece cast monoblock designed for motorsport use. Its clean 7-spoke design was developed specifically for drift and circuit racing, offering a balance of strength and weight savings. The Emotion line represents Work's commitment to making competition-grade wheels accessible to enthusiasts.",
      },
      {
        name: "VS-KF",
        keywords: ["vs-kf", "vs kf"],
        era: "2000s–present",
        construction: "3-Piece Forged",
        story: "The Work VS-KF is a refined 3-piece forged wheel from the VS (Varianza) series, designed for luxury sport applications. Its deep concave face and aggressive lip options make it a popular choice for VIP and stance builds. The VS line showcases Work's ability to blend motorsport engineering with sophisticated street aesthetics.",
      },
      {
        name: "CR Kiwami",
        keywords: ["cr kiwami", "cr-kiwami"],
        era: "2010s–present",
        construction: "1-Piece Cast",
        story: "The Work CR Kiwami (meaning \"ultimate\" in Japanese) is a 1-piece cast wheel with a bold multi-spoke design. Part of Work's more affordable lineup, it delivers the visual impact of a multi-piece wheel in a lightweight monoblock construction, making it popular for daily-driven enthusiast cars.",
      },
      {
        name: "Gnosis GS2",
        keywords: ["gnosis gs2", "gnosis-gs2"],
        era: "2000s–present",
        construction: "3-Piece Forged",
        story: "The Work Gnosis GS2 is a premium 3-piece forged wheel from the Gnosis luxury line. With its elegant multi-spoke face and polished lips, the GS2 was designed for high-end luxury and VIP vehicles. The Gnosis series represents Work's pinnacle of craftsmanship, targeting the exclusive luxury segment of Japanese car culture.",
      },
      {
        name: "VS-XX",
        keywords: ["vs-xx", "vs xx"],
        era: "2000s–present",
        construction: "3-Piece Forged",
        story: "The Work VS-XX is one of the most recognizable 3-piece forged wheels in JDM culture. Its classic 5-spoke design with deep dish lips has graced countless show cars and track builds. The VS-XX epitomizes the golden era of Japanese 3-piece wheel design, offering extreme width and offset combinations.",
      },
      {
        name: "Rezax 2",
        keywords: ["rezax 2", "rezax-2", "rezax2"],
        era: "2000s–present",
        construction: "3-Piece Forged",
        story: "The Work Rezax 2 is a 3-piece forged wheel featuring a distinctive multi-spoke face with a modern twist on classic JDM design. Available in large diameters from 18 to 20 inches, it bridges the gap between traditional deep-dish style and contemporary wheel design. Its versatile PCD options make it compatible with a wide range of European and Japanese platforms.",
      },
      {
        name: "Schwert SC4",
        keywords: ["schwert sc4", "schwert-sc4"],
        era: "2000s–present",
        construction: "3-Piece Forged",
        story: "The Work Schwert SC4 is a 3-piece forged wheel from the Schwert (German for \"sword\") series, designed for European luxury vehicles. Its flowing multi-spoke design is engineered for large-diameter applications, commonly seen on Mercedes-Benz, BMW, and Audi platforms. The Schwert line demonstrates Work's global appeal beyond the JDM market.",
      },
    ],
  },
  {
    brand: "BBS",
    keywords: ["bbs"],
    founded: 1970,
    country: "Germany",
    city: "Schiltach, Black Forest",
    logo: "/images/brands/bbs.png",
    founders: "Heinrich Baumgartner & Klaus Brand",
    story: "Founded in 1970 in Schiltach, deep in Germany's Black Forest, BBS began as a manufacturer of fiberglass racing body parts before pivoting to wheel production in 1972. The name BBS comes from its founders (Baumgartner, Brand) and location (Schiltach). Their pioneering 3-piece racing wheels revolutionized motorsport, and BBS went on to supply Formula 1 teams, winning championships with Ferrari, Williams, and McLaren. Today, BBS is regarded as one of the world's most prestigious wheel manufacturers.",
    models: [
      {
        name: "RS-GT",
        keywords: ["rs-gt", "rs gt"],
        era: "2000s–present",
        construction: "2-Piece Forged",
        story: "The BBS RS-GT is a 2-piece forged wheel that modernizes the legendary RS design for contemporary vehicles. Featuring BBS's signature cross-spoke pattern with a forged center and diamond-cut lip, the RS-GT carries the DNA of the original RS that defined the custom wheel industry in the 1980s. Its 911H variant was specifically engineered for Porsche applications.",
      },
      {
        name: "RS 043",
        keywords: ["rs 043", "rs-043", "rs043"],
        era: "1980s–1990s",
        construction: "3-Piece Forged",
        story: "The BBS RS 043 is a classic 3-piece forged wheel from the original RS line that made BBS a household name. First introduced in the 1980s, the RS series with its iconic mesh pattern and gold bolt ring became the most copied wheel design in history. Genuine RS models like the 043 are highly sought after by collectors and enthusiasts worldwide.",
      },
    ],
  },
  {
    brand: "SSR",
    keywords: ["ssr"],
    founded: 1971,
    country: "Japan",
    city: "Osaka",
    logo: "/images/brands/ssr.png",
    story: "SSR — Speed Star Racing — was founded in 1971 in Osaka, Japan. They created the MK-I, widely recognized as the world's first commercially available 3-piece wheel, fundamentally changing both motorsport and aftermarket wheel design. From Formula Mesh to Professor to Vienna, SSR has consistently pushed the boundaries of wheel construction. Their Professor line, in particular, became an icon of Japanese car culture with its aggressive step-lip designs.",
    models: [
      {
        name: "Integral GT1",
        keywords: ["integral gt1", "integral-gt1"],
        era: "2000s–present",
        construction: "1-Piece Forged",
        story: "The SSR Integral GT1 is a 1-piece forged monoblock wheel designed for high-performance applications. Its clean multi-spoke design and forged construction deliver exceptional strength-to-weight ratio, making it a popular choice for track-focused builds where every gram matters.",
      },
      {
        name: "Vienna Kreis",
        keywords: ["vienna kreis"],
        era: "2000s–present",
        construction: "3-Piece Forged",
        story: "The SSR Vienna Kreis (German for \"circle\") is a 3-piece forged wheel from SSR's luxury Vienna line. Featuring a distinctive multi-spoke face with deep concave options, the Vienna series was designed to rival European luxury wheel brands while maintaining SSR's Japanese engineering precision.",
      },
      {
        name: "Vienna Noble",
        keywords: ["vienna noble"],
        era: "2000s–present",
        construction: "3-Piece Forged",
        story: "The SSR Vienna Noble is a 3-piece forged wheel from the Vienna luxury line, featuring an elegant 5-spoke design with pronounced concavity. It targets the VIP sedan market, popular on platforms like the Toyota Crown and Lexus LS. The Noble represents SSR's refined side, balancing visual sophistication with deep-dish aggression.",
      },
      {
        name: "Minerva",
        keywords: ["minerva"],
        era: "2000s–present",
        construction: "3-Piece Forged",
        story: "Named after the Roman goddess of wisdom and strategic warfare, the SSR Minerva is a 3-piece forged wheel featuring an intricate multi-spoke design. It represents SSR's more exclusive offerings, with limited production numbers and premium finishes that set it apart from the brand's mainstream lineup.",
      },
    ],
  },
  {
    brand: "Weds",
    keywords: ["weds", "kranze"],
    founded: 1965,
    country: "Japan",
    city: "Osaka",
    logo: "/images/brands/weds.png",
    story: "Founded in 1965 as Nippo Ltd in Osaka, Weds started as an OEM wheel supplier for Nissan before entering the aftermarket in 1969 with the Elster brand. In 1977, they created the world's first aluminum forged 3-piece wheel, the RACINGFORG, a groundbreaking innovation that changed the industry. The Kranze sub-brand, launched for the luxury VIP market, has become synonymous with deep-dish elegance on high-end Japanese sedans.",
    models: [
      {
        name: "Kranze Ratzinger",
        keywords: ["kranze ratzinger", "ratzinger"],
        era: "2000s–present",
        construction: "3-Piece Forged",
        story: "The Weds Kranze Ratzinger is a 3-piece forged wheel from the premium Kranze line, featuring a bold multi-spoke face designed for the VIP and luxury sedan market. Named with Germanic flair to evoke European sophistication, the Ratzinger combines Japanese precision manufacturing with continental styling cues.",
      },
      {
        name: "Kranze Cerberus",
        keywords: ["kranze cerberus", "cerberus"],
        era: "2000s–present",
        construction: "3-Piece Forged",
        story: "Named after the mythological three-headed guardian of the underworld, the Weds Kranze Cerberus is a 3-piece forged wheel with a dramatic multi-spoke design. Available in multiple iterations, the Cerberus line targets aggressive VIP builds where visual impact is paramount. Its deep-dish options and intricate spoke patterns make it a standout in the Kranze lineup.",
      },
    ],
  },
  {
    brand: "Advan",
    keywords: ["advan", "advanti", "avs"],
    founded: 1978,
    country: "Japan",
    city: "Yokohama",
    logo: "/images/brands/advan.png",
    story: "Advan Racing is the wheel division of Yokohama Rubber Company, which was founded in 1917. The Advan brand itself launched in 1978 as Japan's first sport-specific tire brand, with the name derived from \"advantage.\" Advan Racing wheels carry decades of motorsport heritage, with Yokohama's involvement spanning Formula 1 support, Super GT, and global touring car championships. Every Advan wheel is designed in Japan with a focus on lightweight performance.",
    models: [
      {
        name: "AVS6",
        keywords: ["avs6", "avs 6", "avs-6"],
        era: "2000s–present",
        construction: "1-Piece Cast",
        story: "The Advan AVS6 is part of the AVS (Advan Vehicle Sports) line, designed as a sporty 6-spoke wheel for street and light track use. Its clean, timeless design reflects Yokohama's motorsport DNA, offering a balance of affordability and performance in a lightweight cast construction.",
      },
      {
        name: "Model T7",
        keywords: ["model t7", "model-t7"],
        era: "2000s–present",
        construction: "1-Piece Cast",
        story: "The Advan Model T7 is a 7-spoke cast wheel that channels the classic motorsport aesthetic of the original Advan Racing designs. Its straightforward spoke pattern prioritizes airflow to brake components, making it both functionally and visually suited for performance-oriented builds.",
      },
    ],
  },
  {
    brand: "Leon Hardiritt",
    keywords: ["leon hardiritt", "hardiritt"],
    founded: 1998,
    country: "Japan",
    city: "Osaka",
    story: "Leon Hardiritt was born in 1998 when European distributors requested a premium wheel line tailored to German luxury vehicles. Produced by Superstar Wheel Inc. in Japan, Leon Hardiritt fuses Japanese 3-piece forging precision with European design sensibility. The brand's German name and styling cues belie its Osaka origins, creating a unique fusion that appeals to owners of Mercedes-Benz, BMW, and Audi who demand exclusivity beyond mainstream options.",
    models: [
      {
        name: "Orden",
        keywords: ["orden"],
        era: "2010s–present",
        construction: "3-Piece Forged",
        story: "The Leon Hardiritt Orden (German for \"order\" or \"medal\") is a 3-piece forged wheel featuring an intricate multi-spoke design with deep concave profiles. Designed for large German sedans and SUVs, the Orden delivers a commanding presence with its aggressive lip depth and precision-machined center.",
      },
      {
        name: "Ritter",
        keywords: ["ritter"],
        era: "2010s–present",
        construction: "3-Piece Forged",
        story: "The Leon Hardiritt Ritter (German for \"knight\") is a 3-piece forged wheel with a strong, geometric spoke design. True to its name, the Ritter projects strength and nobility, designed specifically for the stance and luxury VIP community. Its deep-dish configurations make it a favorite for lowered European sedans.",
      },
    ],
  },
  {
    brand: "OZ Racing",
    keywords: ["oz", "oz racing"],
    founded: 1971,
    country: "Italy",
    city: "Rossano Veneto, Vicenza",
    logo: "/images/brands/oz.png",
    founders: "Silvano Oselladore & Pietro Zen",
    story: "OZ Racing was founded in 1971 by Silvano Oselladore and Pietro Zen in a gas station near Vicenza, Italy — the \"OZ\" name combining their initials. From these humble beginnings, OZ grew to become one of motorsport's most decorated wheel suppliers, equipping Formula 1 champions including Michael Schumacher and Lewis Hamilton. Their wheels have won more F1 races than any other manufacturer, a testament to Italian engineering passion meeting racing excellence.",
    models: [
      {
        name: "Cygnus",
        keywords: ["cygnus"],
        era: "2000s–present",
        construction: "1-Piece Cast",
        story: "The OZ Cygnus is a luxury-oriented cast wheel designed for European touring and grand tourer vehicles. Named after the swan constellation, it brings OZ's motorsport heritage to the premium segment with an elegant multi-spoke pattern that suits vehicles like the BMW 5-Series and Mercedes E-Class.",
      },
      {
        name: "F1",
        keywords: ["racing f1", "oz f1"],
        era: "1990s–2000s",
        construction: "1-Piece Cast",
        story: "The OZ Racing F1 draws its name from OZ's extensive Formula 1 heritage. This lightweight cast wheel features a clean 5-spoke design inspired by the brand's single-seater racing wheels. It represents the accessibility of genuine motorsport engineering for street use.",
      },
    ],
  },
  {
    brand: "Eclair",
    keywords: ["eclair"],
    founded: 1990,
    country: "Germany",
    city: "Germany",
    story: "Eclair is an extremely rare German wheel brand from the 1990s that produced premium 3-piece split-rim wheels before ceasing operations before the end of the decade. Known for their forged aluminum centers with large polished lips and distinctive 5-star designs, Eclair wheels are now highly collectible. Their short production run and quality craftsmanship have made them prized finds in the European enthusiast community, particularly among BMW and Audi owners.",
    models: [
      {
        name: "5-Star",
        keywords: ["eclair"],
        era: "1990s",
        construction: "3-Piece Forged",
        story: "The Eclair 5-Star is the brand's signature design — a 3-piece forged wheel with a distinctive star-shaped center and generously sized polished lip. Produced in limited quantities during the 1990s, surviving examples are extremely rare. Their 5x112 bolt pattern makes them particularly sought after for classic German performance cars.",
      },
    ],
  },
  {
    brand: "Enkei",
    keywords: ["enkei"],
    founded: 1950,
    country: "Japan",
    city: "Hamamatsu, Shizuoka",
    logo: "/images/brands/enkei.png",
    story: "Enkei was founded in 1950 in Hamamatsu, Japan, originally as a maker of motorcycle and industrial wheels. Their development of MAT (Most Advanced Technology) flow-forming process in the 1980s revolutionized lightweight wheel manufacturing, making high-strength, low-weight wheels accessible to enthusiasts worldwide. Enkei supplies OEM wheels to top manufacturers including Subaru, Mitsubishi, and Honda, and their racing wheels have seen action in Formula 1, WRC, and Super GT.",
    models: [
      {
        name: "RPF1",
        keywords: ["rpf1", "rpf-1"],
        era: "2001–present",
        construction: "1-Piece Flow-Formed",
        story: "The Enkei RPF1 is one of the most iconic lightweight wheels ever made, launched in 2001. Using Enkei's proprietary MAT flow-forming technology, it achieves an exceptional strength-to-weight ratio that has made it the go-to choice for track enthusiasts and time attack competitors worldwide.",
      },
    ],
  },
  {
    brand: "Blitz",
    keywords: ["blitz"],
    founded: 1980,
    country: "Japan",
    city: "Tokyo",
    logo: "/images/brands/blitz.png",
    story: "Blitz was founded in 1980 in Tokyo, Japan, starting as a turbo kit manufacturer before expanding into a full-range tuning parts brand. Known for their aggressive styling and motorsport involvement, Blitz became a household name in the Japanese tuning scene through the 1990s drift and grip culture. Their wheels, turbos, and ECU tuning products have been featured on countless magazine cover cars and competition vehicles.",
    models: [
      {
        name: "03",
        keywords: ["blitz 03", "blitz03"],
        era: "1990s",
        construction: "2-Piece",
        story: "The Blitz 03 is a classic 1990s multi-spoke design that epitomizes the golden era of Japanese tuning culture. Its aggressive concave profile and lightweight construction made it a popular choice for street and drift builds throughout the late 1990s.",
      },
    ],
  },
  {
    brand: "Revolution",
    keywords: ["revolution"],
    founded: 1967,
    country: "United Kingdom",
    city: "UK",
    story: "Revolution Wheels was founded in 1967 in the United Kingdom to meet the growing demand for lightweight motorsport wheels. Their iconic 4-spoke design became a staple of British rally and circuit racing throughout the 1970s and 1980s. Revolution's commitment to producing strong, lightweight wheels for real competition use earned them a loyal following in the grassroots motorsport community.",
    models: [
      {
        name: "4-Spoke",
        keywords: ["revolution", "4 spoke", "4-spoke"],
        era: "1967–present",
        construction: "1-Piece Cast",
        story: "The Revolution 4-Spoke is the brand's founding design, introduced alongside the company in 1967. Its simple yet functional 4-spoke pattern was engineered for minimum weight and maximum brake cooling — essential for rally and circuit racing. These wheels have competed in countless British club racing events and remain in production today.",
      },
    ],
  },
];

export function findBrandStory(productTitle: string): { brand: BrandStory; model: ModelStory | null } | null {
  const lower = productTitle.toLowerCase();

  for (const brand of brandStories) {
    const brandMatch = brand.keywords.some(kw => lower.includes(kw));
    if (!brandMatch) continue;

    let bestModel: ModelStory | null = null;
    let bestLen = 0;
    for (const model of brand.models) {
      for (const kw of model.keywords) {
        if (lower.includes(kw) && kw.length > bestLen) {
          bestModel = model;
          bestLen = kw.length;
        }
      }
    }

    return { brand, model: bestModel };
  }

  return null;
}
