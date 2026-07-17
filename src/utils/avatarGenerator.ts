/**
 * Seedable Procedural Avatar Generator for AVER Platform.
 * Generates beautiful, modern, high-quality flat vector illustration avatars.
 * Produces deterministic, unique outcomes for any given string seed (e.g., user UID).
 */

// Simple robust seedable PRNG (Linear Congruential Generator / Hashing)
function createSeededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return function() {
    h = Math.imul(h ^ h >>> 16, 2246822507) | 0;
    h = Math.imul(h ^ h >>> 13, 3266489909) | 0;
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  };
}

// Visual asset color palettes
const PALETTES = {
  skin: [
    '#FFD1B3', // Soft Peach
    '#FEE3D4', // Fair Ivory
    '#E8A276', // Honey Bronze
    '#C67C4B', // Radiant Amber
    '#A55D35', // Deep Copper
    '#8D5524', // Warm Espresso
    '#5E2F15', // Rich Cocoa
    '#F1C27D', // Golden Beige
  ],
  hair: [
    '#1A1D20', // Charcoal Black
    '#2E251E', // Dark Espresso
    '#4E3629', // Chocolate Brown
    '#7D4E33', // Chestnut Brown
    '#9E522F', // Autumn Auburn
    '#C47335', // Copper Red
    '#DCAE58', // Honey Blonde
    '#F5D38A', // Sunset Blonde
    '#E0E5EB', // Silver Platinum
    '#A1A8B3', // Slate Grey
    '#10B981', // Emerald Mint
    '#3B82F6', // Neon Blue
    '#EC4899', // Cyber Pink
    '#8B5CF6', // Electric Purple
  ],
  clothing: [
    '#10B981', // Emerald
    '#059669', // Forest Green
    '#3B82F6', // Royal Blue
    '#2563EB', // Sapphire Blue
    '#06B6D4', // Cool Cyan
    '#8B5CF6', // Violet Purple
    '#6366F1', // Indigo Tech
    '#EC4899', // Electric Rose
    '#F43F5E', // Coral Red
    '#DC2626', // Crimson Red
    '#F59E0B', // Amber Gold
    '#D97706', // Burned Orange
    '#475569', // Steel Slate
    '#1E293B', // Dark Indigo
    '#0F172A', // Midnight Blue
  ],
  eyes: [
    '#3B82F6', // Vibrant Blue
    '#10B981', // Jade Green
    '#8B5A2B', // Hazel Brown
    '#4B5563', // Slate Grey
    '#8B5CF6', // Violet
    '#D97706', // Amber Gold
    '#111827', // Deep Charcoal
  ],
  backgrounds: [
    { from: '#10B981', to: '#059669' }, // Emerald Glow
    { from: '#3B82F6', to: '#1D4ED8' }, // Cobalt Deep
    { from: '#8B5CF6', to: '#6D28D9' }, // Purple Haze
    { from: '#EC4899', to: '#BE185D' }, // Velvet Rose
    { from: '#F59E0B', to: '#D97706' }, // Amber Sun
    { from: '#06B6D4', to: '#0891B2' }, // Ocean Teal
    { from: '#6366F1', to: '#4F46E5' }, // Cyber Indigo
    { from: '#14B8A6', to: '#0F766E' }, // Mint Teal
    { from: '#F43F5E', to: '#E11D48' }, // Crimson Pulse
  ],
  glasses: [
    '#111827', // Matte Black
    '#FBBF24', // Yellow Gold
    '#D1D5DB', // Brushed Silver
    '#4B5563', // Tortoise Slate
    '#EF4444', // Cyber Red
  ]
};

export interface AvatarTraits {
  skinTone: string;
  hairColor: string;
  clothingColor: string;
  clothingColorDark: string;
  clothingColorLight: string;
  eyeColor: string;
  glassesColor: string;
  bgColor: { from: string; to: string };
  faceType: number;      // 0-3
  clothingType: number;  // 0-4
  earsType: number;      // 0-1 (earrings or not)
  earringColor: string;
  eyesType: number;      // 0-4
  eyebrowsType: number;  // 0-3
  noseType: number;      // 0-3
  mouthType: number;     // 0-4
  beardType: number;     // 0-4
  moustacheType: number; // 0-3
  hairType: number;      // 0-9
  glassesType: number;   // 0-3 (0 = none)
}

/**
 * Extracts a structured set of traits deterministically from a seed string.
 */
export function getTraitsFromSeed(seed: string): AvatarTraits {
  const rnd = createSeededRandom(seed || 'aver_default');

  const getElement = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
  const getInt = (min: number, max: number): number => Math.floor(rnd() * (max - min + 1)) + min;

  const skinTone = getElement(PALETTES.skin);
  const hairColor = getElement(PALETTES.hair);
  const clothingColor = getElement(PALETTES.clothing);
  const eyeColor = getElement(PALETTES.eyes);
  const glassesColor = getElement(PALETTES.glasses);
  const bgColor = getElement(PALETTES.backgrounds);

  // Derive lighter and darker versions of clothing for depths/collars
  const clothingColorDark = adjustColorBrightness(clothingColor, -25);
  const clothingColorLight = adjustColorBrightness(clothingColor, 25);

  return {
    skinTone,
    hairColor,
    clothingColor,
    clothingColorDark,
    clothingColorLight,
    eyeColor,
    glassesColor,
    bgColor,
    faceType: getInt(0, 3),
    clothingType: getInt(0, 4),
    earsType: getInt(0, 1),
    earringColor: rnd() > 0.5 ? '#FBBF24' : '#E5E7EB', // Gold vs Silver
    eyesType: getInt(0, 4),
    eyebrowsType: getInt(0, 3),
    noseType: getInt(0, 3),
    mouthType: getInt(0, 4),
    beardType: getInt(0, 4), // 0 = none
    moustacheType: getInt(0, 3), // 0 = none
    hairType: getInt(0, 9), // 0 = bald
    glassesType: rnd() > 0.65 ? getInt(1, 3) : 0, // 35% chance of glasses
  };
}

/**
 * Adjusts HEX color brightness
 */
function adjustColorBrightness(hex: string, percent: number): string {
  const R = parseInt(hex.substring(1, 3), 16);
  const G = parseInt(hex.substring(3, 5), 16);
  const B = parseInt(hex.substring(5, 7), 16);

  const adjust = (val: number) => Math.max(0, Math.min(255, Math.round(val + (val * percent / 100))));

  const rHex = adjust(R).toString(16).padStart(2, '0');
  const gHex = adjust(G).toString(16).padStart(2, '0');
  const bHex = adjust(B).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

/**
 * Renders the deterministic avatar SVG string based on traits.
 * Uses fully responsive inline SVG structure with standard viewBox "0 0 100 100"
 */
export function generateAvatarSvg(seed: string): string {
  const traits = getTraitsFromSeed(seed);
  const {
    skinTone,
    hairColor,
    clothingColor,
    clothingColorDark,
    clothingColorLight,
    eyeColor,
    glassesColor,
    bgColor,
    faceType,
    clothingType,
    earsType,
    earringColor,
    eyesType,
    eyebrowsType,
    noseType,
    mouthType,
    beardType,
    moustacheType,
    hairType,
    glassesType
  } = traits;

  const gradId = `bg-grad-${seed.replace(/[^a-zA-Z0-9]/g, '')}`;

  // 1. Background circle and gradient definition
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
      <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgColor.from}" />
        <stop offset="100%" stop-color="${bgColor.to}" />
      </linearGradient>
    </defs>
    <!-- Background -->
    <circle cx="50" cy="50" r="48" fill="url(#${gradId})" />`;

  // 2. Clothing (starts around y = 74 to y = 100)
  // T-Shirt (0), Hoodie (1), Suit (2), Polo (3), Overalls (4)
  if (clothingType === 0) {
    // T-Shirt
    svg += `
    <path d="M 26 84 C 26 74, 74 74, 74 84 L 81 100 L 19 100 Z" fill="${clothingColor}" />
    <path d="M 38 74 C 38 84, 62 84, 62 74" fill="none" stroke="${clothingColorDark}" stroke-width="2.5" stroke-linecap="round" />`;
  } else if (clothingType === 1) {
    // Hoodie
    svg += `
    <path d="M 23 74 C 23 64, 77 64, 77 74 L 83 100 L 17 100 Z" fill="${clothingColorDark}" />
    <path d="M 31 80 C 31 74, 69 74, 69 80 L 76 100 L 24 100 Z" fill="${clothingColor}" />
    <path d="M 46 83 L 46 93 M 54 83 L 54 93" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.85" />`;
  } else if (clothingType === 2) {
    // Suit & Tie
    svg += `
    <path d="M 28 78 L 72 78 L 76 100 L 24 100 Z" fill="#FFFFFF" />
    <path d="M 46 78 L 54 78 L 55 93 L 50 97 L 45 93 Z" fill="#EF4444" />
    <path d="M 20 82 L 41 91 L 18 100 Z" fill="${clothingColor}" />
    <path d="M 80 82 L 59 91 L 82 100 Z" fill="${clothingColor}" />
    <path d="M 41 91 L 50 98 L 59 91" fill="none" stroke="${clothingColorDark}" stroke-width="1.5" />`;
  } else if (clothingType === 3) {
    // Polo Shirt
    svg += `
    <path d="M 26 82 C 26 75, 74 75, 74 82 L 81 100 L 19 100 Z" fill="${clothingColor}" />
    <path d="M 50 75 L 50 84" fill="none" stroke="${clothingColorDark}" stroke-width="2" />
    <path d="M 34 75 L 50 81 L 46 74 Z" fill="${clothingColorLight}" />
    <path d="M 66 75 L 50 81 L 54 74 Z" fill="${clothingColorLight}" />`;
  } else {
    // Overalls / Braces
    svg += `
    <path d="M 26 82 C 26 75, 74 75, 74 82 L 81 100 L 19 100 Z" fill="#F8FAFC" />
    <path d="M 32 84 L 68 84 L 73 100 L 27 100 Z" fill="${clothingColor}" />
    <path d="M 33 84 L 37 75" fill="none" stroke="${clothingColorDark}" stroke-width="4" stroke-linecap="round" />
    <path d="M 67 84 L 63 75" fill="none" stroke="${clothingColorDark}" stroke-width="4" stroke-linecap="round" />
    <circle cx="35" cy="88" r="1.5" fill="#FBBF24" />
    <circle cx="65" cy="88" r="1.5" fill="#FBBF24" />`;
  }

  // 3. Neck & Face Setup
  // Neck
  svg += `
    <!-- Neck -->
    <path d="M 42 60 L 42 76 C 42 76, 50 80, 58 76 L 58 60 Z" fill="${skinTone}" />
    <path d="M 42 66 C 45 71, 55 71, 58 66" fill="none" stroke="#1F2937" stroke-width="2" opacity="0.15" />`;

  // 4. Ears & Earring accessories
  // Left ear circle at (30.5, 49) and Right ear at (69.5, 49)
  svg += `
    <!-- Ears -->
    <circle cx="31" cy="49" r="4.5" fill="${skinTone}" />
    <circle cx="69" cy="49" r="4.5" fill="${skinTone}" />`;

  if (earsType === 1) {
    // Left ear gold or silver ring
    svg += `
    <circle cx="30" cy="52" r="2.2" fill="none" stroke="${earringColor}" stroke-width="1" />
    <circle cx="70" cy="52" r="2.2" fill="none" stroke="${earringColor}" stroke-width="1" />`;
  }

  // 5. Face Shapes
  // Round (0), Oval (1), Square (2), Heart (3)
  if (faceType === 0) {
    // Round face
    svg += `
    <path d="M 32 48 C 32 29, 68 29, 68 48 C 68 65, 32 65, 32 48 Z" fill="${skinTone}" />`;
  } else if (faceType === 1) {
    // Oval / Long Face
    svg += `
    <path d="M 33 45 C 33 26, 67 26, 67 45 C 67 67, 33 67, 33 45 Z" fill="${skinTone}" />`;
  } else if (faceType === 2) {
    // Square Face
    svg += `
    <path d="M 33 46 C 33 28, 67 28, 67 46 C 67 61, 62 65, 50 67 C 38 65, 33 61, 33 46 Z" fill="${skinTone}" />`;
  } else {
    // Heart Face
    svg += `
    <path d="M 32 45 C 32 26, 68 26, 68 45 C 68 56, 60 63, 50 67 C 40 63, 32 56, 32 45 Z" fill="${skinTone}" />`;
  }

  // Blush on cheeks (adds that super premium, friendly vector illustration look!)
  svg += `
    <!-- Blush -->
    <circle cx="37" cy="53" r="3" fill="#F43F5E" opacity="0.15" />
    <circle cx="63" cy="53" r="3" fill="#F43F5E" opacity="0.15" />`;

  // 6. Eyes
  // Happy (0), Big Focused (1), Wink (2), Sleepy (3), Simple Dot (4)
  if (eyesType === 0) {
    // Happy
    svg += `
    <!-- Eyes (Happy) -->
    <path d="M 39 46 Q 43 42 47 46" fill="none" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 53 46 Q 57 42 61 46" fill="none" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" />`;
  } else if (eyesType === 1) {
    // Big Focused
    svg += `
    <!-- Eyes (Focused) -->
    <ellipse cx="43" cy="45.5" rx="4.2" ry="3.2" fill="#FFFFFF" />
    <ellipse cx="57" cy="45.5" rx="4.2" ry="3.2" fill="#FFFFFF" />
    <circle cx="43" cy="45.5" r="2.5" fill="${eyeColor}" />
    <circle cx="57" cy="45.5" r="2.5" fill="${eyeColor}" />
    <circle cx="43" cy="45.5" r="1.2" fill="#1E293B" />
    <circle cx="57" cy="45.5" r="1.2" fill="#1E293B" />
    <circle cx="42" cy="44.2" r="0.7" fill="#FFFFFF" />
    <circle cx="56" cy="44.2" r="0.7" fill="#FFFFFF" />`;
  } else if (eyesType === 2) {
    // Wink
    svg += `
    <!-- Eyes (Wink) -->
    <ellipse cx="43" cy="45.5" rx="4.2" ry="3.2" fill="#FFFFFF" />
    <circle cx="43" cy="45.5" r="2.5" fill="${eyeColor}" />
    <circle cx="43" cy="45.5" r="1.2" fill="#1E293B" />
    <circle cx="42" cy="44.2" r="0.7" fill="#FFFFFF" />
    <path d="M 53 45 Q 57 48 61 45" fill="none" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round" />`;
  } else if (eyesType === 3) {
    // Sleepy / Half Closed
    svg += `
    <!-- Eyes (Sleepy) -->
    <ellipse cx="43" cy="46" rx="4" ry="2" fill="#FFFFFF" />
    <ellipse cx="57" cy="46" rx="4" ry="2" fill="#FFFFFF" />
    <circle cx="43" cy="46" r="2" fill="${eyeColor}" />
    <circle cx="57" cy="46" r="2" fill="${eyeColor}" />
    <path d="M 39 45 L 47 45" stroke="#1E293B" stroke-width="2" />
    <path d="M 53 45 L 61 45" stroke="#1E293B" stroke-width="2" />`;
  } else {
    // Simple Dot
    svg += `
    <!-- Eyes (Dot) -->
    <circle cx="43" cy="46" r="2.2" fill="#1E293B" />
    <circle cx="57" cy="46" r="2.2" fill="#1E293B" />`;
  }

  // 7. Eyebrows
  // Flat (0), Arched (1), Angry (2), Worried (3)
  if (eyebrowsType === 0) {
    svg += `
    <!-- Eyebrows -->
    <path d="M 37 40 L 47 40" fill="none" stroke="${hairColor}" stroke-width="2.2" stroke-linecap="round" />
    <path d="M 53 40 L 63 40" fill="none" stroke="${hairColor}" stroke-width="2.2" stroke-linecap="round" />`;
  } else if (eyebrowsType === 1) {
    svg += `
    <!-- Eyebrows -->
    <path d="M 37 41 Q 42 37 47 41" fill="none" stroke="${hairColor}" stroke-width="2.2" stroke-linecap="round" />
    <path d="M 53 41 Q 58 37 63 41" fill="none" stroke="${hairColor}" stroke-width="2.2" stroke-linecap="round" />`;
  } else if (eyebrowsType === 2) {
    svg += `
    <!-- Eyebrows -->
    <path d="M 37 39 L 47 42" fill="none" stroke="${hairColor}" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 53 42 L 63 39" fill="none" stroke="${hairColor}" stroke-width="2.5" stroke-linecap="round" />`;
  } else {
    svg += `
    <!-- Eyebrows -->
    <path d="M 37 42 Q 42 39 47 41" fill="none" stroke="${hairColor}" stroke-width="2.2" stroke-linecap="round" />
    <path d="M 53 41 Q 58 39 63 42" fill="none" stroke="${hairColor}" stroke-width="2.2" stroke-linecap="round" />`;
  }

  // 8. Nose
  // Button (0), Bridge (1), Curved (2), Triangle Shadow (3)
  if (noseType === 0) {
    svg += `
    <!-- Nose -->
    <path d="M 48 51 Q 50 53 52 51" fill="none" stroke="#1F2937" stroke-width="1.8" stroke-linecap="round" opacity="0.45" />`;
  } else if (noseType === 1) {
    svg += `
    <!-- Nose -->
    <path d="M 49 45 L 49 52 Q 49 54 52 54" fill="none" stroke="#1F2937" stroke-width="1.8" stroke-linecap="round" opacity="0.4" />`;
  } else if (noseType === 2) {
    svg += `
    <!-- Nose -->
    <path d="M 51 47 Q 48 51 51 53" fill="none" stroke="#1F2937" stroke-width="1.8" stroke-linecap="round" opacity="0.45" />`;
  } else {
    svg += `
    <!-- Nose -->
    <polygon points="49,49 51.5,53 47.5,53" fill="#000000" opacity="0.08" />`;
  }

  // 9. Beard & Moustache (under/around mouth)
  // Beard Types: None (0), Stubble (1), Full Beard (2), Goatee (3), Circle (4)
  if (beardType === 1) {
    // Stubble shading
    svg += `
    <!-- Beard (Stubble) -->
    <path d="M 34 52 C 34 65, 66 65, 66 52 C 66 63, 34 63, 34 52 Z" fill="#22252A" opacity="0.14" />`;
  } else if (beardType === 2) {
    // Full Beard
    svg += `
    <!-- Beard (Full) -->
    <path d="M 32 47 C 32 66, 68 66, 68 47 C 68 68, 32 68, 32 47 Z" fill="${hairColor}" />`;
  } else if (beardType === 3) {
    // Goatee
    svg += `
    <!-- Beard (Goatee) -->
    <path d="M 46 56 C 46 66, 54 66, 54 56 C 54 68, 46 68, 46 56 Z" fill="${hairColor}" />`;
  } else if (beardType === 4) {
    // Circle Beard (goatee + framing the mouth)
    svg += `
    <!-- Beard (Circle) -->
    <path d="M 44 54 Q 50 51 56 54 C 58 64, 42 64, 44 54 Z" fill="none" stroke="${hairColor}" stroke-width="3" />`;
  }

  // Moustache Types: None (0), Pencil (1), Handlebar (2), Thick (3)
  if (moustacheType === 1) {
    svg += `
    <!-- Moustache (Pencil) -->
    <path d="M 44 56 Q 50 54 56 56" fill="none" stroke="${hairColor}" stroke-width="2" stroke-linecap="round" />`;
  } else if (moustacheType === 2) {
    svg += `
    <!-- Moustache (Handlebar) -->
    <path d="M 43 56 Q 47 54 50 56 Q 53 54 57 56 Q 60 54 59 57 M 43 56 Q 40 54 41 57" fill="none" stroke="${hairColor}" stroke-width="2.2" stroke-linecap="round" />`;
  } else if (moustacheType === 3) {
    svg += `
    <!-- Moustache (Thick) -->
    <path d="M 41 56 Q 50 53 59 56 C 57 59, 43 59, 41 56 Z" fill="${hairColor}" />`;
  }

  // 10. Mouth
  // Smile (0), Big Open Smile (1), Neutral (2), Surprised (3), Cool Grin (4)
  if (mouthType === 0) {
    svg += `
    <!-- Mouth (Smile) -->
    <path d="M 44 59 Q 50 64 56 59" fill="none" stroke="#1E293B" stroke-width="2.2" stroke-linecap="round" />`;
  } else if (mouthType === 1) {
    svg += `
    <!-- Mouth (Open Smile) -->
    <path d="M 43 58 Q 50 66 57 58 Z" fill="#881B24" />
    <path d="M 44 58.5 Q 50 61.5 56 58.5 L 56 58 L 44 58 Z" fill="#FFFFFF" />`;
  } else if (mouthType === 2) {
    svg += `
    <!-- Mouth (Neutral) -->
    <path d="M 45 59.5 Q 50 58.5 55 59.5" fill="none" stroke="#1E293B" stroke-width="2.2" stroke-linecap="round" />`;
  } else if (mouthType === 3) {
    svg += `
    <!-- Mouth (Surprised) -->
    <circle cx="50" cy="59.5" r="3" fill="#881B24" stroke="#1E293B" stroke-width="1" />`;
  } else {
    svg += `
    <!-- Mouth (Grin) -->
    <path d="M 45 59 Q 48 62.5 54 58" fill="none" stroke="#1E293B" stroke-width="2.2" stroke-linecap="round" />`;
  }

  // 11. Glasses (sitting on top of eyes)
  // None (0), Round (1), Square (2), Sunglasses (3)
  if (glassesType === 1) {
    // Round glasses
    svg += `
    <!-- Glasses (Round) -->
    <circle cx="43" cy="45.5" r="5.8" fill="none" stroke="${glassesColor}" stroke-width="2" />
    <circle cx="57" cy="45.5" r="5.8" fill="none" stroke="${glassesColor}" stroke-width="2" />
    <path d="M 48.8 45.5 Q 50 44 51.2 45.5" fill="none" stroke="${glassesColor}" stroke-width="2" />
    <path d="M 31 45.5 L 37.2 45.5 M 62.8 45.5 L 69 45.5" fill="none" stroke="${glassesColor}" stroke-width="1.5" />`;
  } else if (glassesType === 2) {
    // Square Hipster glasses
    svg += `
    <!-- Glasses (Square) -->
    <rect x="37.5" y="40" width="11" height="10" rx="2" fill="none" stroke="${glassesColor}" stroke-width="2" />
    <rect x="51.5" y="40" width="11" height="10" rx="2" fill="none" stroke="${glassesColor}" stroke-width="2" />
    <path d="M 48.5 44.5 L 51.5 44.5" fill="none" stroke="${glassesColor}" stroke-width="2" />
    <path d="M 31 44.5 L 37.5 44.5 M 62.5 44.5 L 69 44.5" fill="none" stroke="${glassesColor}" stroke-width="1.5" />`;
  } else if (glassesType === 3) {
    // Cool Sunglasses
    svg += `
    <!-- Glasses (Sunglasses) -->
    <path d="M 36 39.5 L 64 39.5 L 61.5 49 Q 50 49 50 42 Q 50 49 38.5 49 Z" fill="#111827" />
    <path d="M 39 42 L 44 47" stroke="#FFFFFF" stroke-width="1" opacity="0.25" stroke-linecap="round" />
    <path d="M 52 42 L 57 47" stroke="#FFFFFF" stroke-width="1" opacity="0.25" stroke-linecap="round" />`;
  }

  // 12. Hair & Headwear Styles
  // Styles: Bald (0), Spiky (1), Side Part (2), Curly Afro (3), Top Bun (4), Long Straight (5), Bob Cut (6), Beanie (7), Baseball Cap (8), Headband (9)
  const hatColor = adjustColorBrightness(clothingColor, -15);
  const hatColorDark = adjustColorBrightness(clothingColor, -35);

  if (hairType === 1) {
    // Spiky Hair
    svg += `
    <!-- Hair (Spiky) -->
    <path d="M 29 40 L 31 29 L 36 33 L 41 25 L 47 31 L 52 24 L 57 31 L 62 25 L 67 33 L 70 29 L 71 40 Z" fill="${hairColor}" />`;
  } else if (hairType === 2) {
    // Side Part
    svg += `
    <!-- Hair (Side Part) -->
    <path d="M 29 41 C 29 20, 60 16, 71 28 C 73 32, 70 42, 69 42 C 66 36, 55 26, 45 30 C 37 34, 33 41, 29 41 Z" fill="${hairColor}" />`;
  } else if (hairType === 3) {
    // Curly Afro (large clouds!)
    svg += `
    <!-- Hair (Curly Afro) -->
    <g fill="${hairColor}">
      <circle cx="50" cy="24" r="9" />
      <circle cx="41" cy="27" r="8.5" />
      <circle cx="59" cy="27" r="8.5" />
      <circle cx="34" cy="34" r="8" />
      <circle cx="66" cy="34" r="8" />
      <circle cx="31" cy="42" r="6" />
      <circle cx="69" cy="42" r="6" />
    </g>`;
  } else if (hairType === 4) {
    // Top Bun / Hipster Knot
    svg += `
    <!-- Hair (Top Bun) -->
    <circle cx="50" cy="21" r="7.5" fill="${hairColor}" />
    <path d="M 30 41 C 30 25, 70 25, 70 41 Z" fill="${hairColor}" />`;
  } else if (hairType === 5) {
    // Long Straight Hair
    svg += `
    <!-- Hair (Long Straight) -->
    <path d="M 30 42 C 30 20, 70 20, 70 42 L 72 65 L 66 65 L 66 45 L 34 45 L 34 65 L 28 65 Z" fill="${hairColor}" />`;
  } else if (hairType === 6) {
    // Bob Cut
    svg += `
    <!-- Hair (Bob Cut) -->
    <path d="M 29 42 C 29 22, 71 22, 71 42 L 72 54 L 66 52 L 66 43 C 55 40, 45 40, 34 43 L 34 52 L 28 54 Z" fill="${hairColor}" />`;
  } else if (hairType === 7) {
    // Beanie
    svg += `
    <!-- Headwear (Beanie) -->
    <path d="M 30 38 C 30 18, 70 18, 70 38 Z" fill="${hatColor}" />
    <rect x="27" y="34" width="46" height="6" rx="3" fill="${hatColorDark}" />
    <circle cx="50" cy="18" r="4" fill="#FFFFFF" opacity="0.9" />`;
  } else if (hairType === 8) {
    // Baseball Cap
    svg += `
    <!-- Headwear (Baseball Cap) -->
    <path d="M 31 38 C 31 23, 69 23, 69 38 Z" fill="${hatColor}" />
    <path d="M 29 38 Q 50 33 71 39 L 69 43 Q 50 37 31 41 Z" fill="${hatColorDark}" />`;
  } else if (hairType === 9) {
    // Headband
    svg += `
    <!-- Headwear (Headband) -->
    <path d="M 30 34 L 32 25 L 39 30 L 48 23 L 56 30 L 64 25 L 68 34 Z" fill="${hairColor}" />
    <rect x="28" y="32" width="44" height="6.5" rx="1.5" fill="${hatColor}" />`;
  }

  // Highlights / Glow on edge
  svg += `
    <!-- Outer Glow Rim -->
    <circle cx="50" cy="50" r="47.5" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.15" />
  </svg>`;

  return svg;
}

/**
 * Converts a generated SVG string into a valid safe data URI that can be rendered inside <img> tags.
 */
export function getAvatarDataUrl(seed: string): string {
  const svg = generateAvatarSvg(seed);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
