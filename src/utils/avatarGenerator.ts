/**
 * Seedable Premium Flat Vector Avatar Generator for AVER Platform.
 * Generates unique, professional, high-end vector illustrations for traders.
 * Replaces real human photos with a consistent fintech design language.
 */

// Helper to generate deterministic pseudo-random numbers from a seed
function seededRandom(seed: string) {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h) + seed.charCodeAt(i) | 0;
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function generateAvatarSvg(seed: string): string {
  const rand = seededRandom(seed);
  
  // Clean seed for DOM IDs
  const safeId = seed.replace(/[^a-zA-Z0-9]/g, '') || 'default';
  const clipId = 'avatar-clip-' + safeId;

  // --- PALETTES ---
  const bgColors = [
    '#FFAD60', '#0EA5E9', '#F472B6', '#34D399', '#A78BFA', '#FBBF24', '#38BDF8', '#FB923C'
  ];

  const skinTones = [
    '#FFDBAC', '#F1C27D', '#E0AC69', '#8D5524', '#C68642', '#3D0C02', '#5A3311', '#FFAD60', '#D2B48C'
  ];

  const hairColors = [
    '#090806', '#2C222B', '#3B3028', '#4E433F', '#504444', '#6A4E42', '#A7856A', '#DCD0BA', '#7A3411', '#4B2C20', '#DC2626', '#EA580C'
  ];

  const clothingColors = [
    '#1e293b', '#334155', '#475569', '#0f172a', '#1e3a8a', '#1e1b4b', '#134e4a', '#3f3f46', '#52525b', '#18181b', '#BE185D', '#4338CA', '#047857', '#B45309'
  ];

  // --- SELECTIONS ---
  const selectedBg = bgColors[Math.floor(rand() * bgColors.length)];
  const selectedSkin = skinTones[Math.floor(rand() * skinTones.length)];
  const selectedHair = hairColors[Math.floor(rand() * hairColors.length)];
  const selectedClothing = clothingColors[Math.floor(rand() * clothingColors.length)];
  const secondaryClothing = clothingColors[Math.floor(rand() * clothingColors.length)];

  // Morphological features
  const isMale = rand() > 0.5;
  const hairStyle = isMale ? Math.floor(rand() * 8) : Math.floor(rand() * 8) + 8; 
  const facialHairType = isMale && rand() < 0.4 ? Math.floor(rand() * 5) : -1;
  const glassType = rand() < 0.3 ? Math.floor(rand() * 4) : -1;
  const headwearType = rand() < 0.15 ? Math.floor(rand() * 3) : -1;
  const clothingType = Math.floor(rand() * 4);
  const neckThickness = isMale ? 14 : 10;
  
  // Facial feature offsets
  const hasBlush = !isMale && rand() > 0.3;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
      <clipPath id="${clipId}">
        <circle cx="50" cy="50" r="46" />
      </clipPath>
      <filter id="drop-shadow-${safeId}" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="1" flood-color="#000" flood-opacity="0.15"/>
      </filter>
    </defs>

    <!-- Outer shadow ring (simulating the inner yellow border effect from reference) -->
    <circle cx="50" cy="52" r="46" fill="#FBBF24" opacity="0.8" />
    
    <!-- White border -->
    <circle cx="50" cy="50" r="48" fill="#FFFFFF" />
    
    <!-- Background -->
    <circle cx="50" cy="50" r="46" fill="${selectedBg}" />

    <!-- Clipped Avatar Content -->
    <g clip-path="url(#${clipId})">
      
      <!-- Back Hair (for long female hair) -->
      <g fill="${selectedHair}">
        ${hairStyle === 8 ? '<!-- Long straight --> <path d="M30 40 L25 80 L75 80 L70 40 Z" />' : ''}
        ${hairStyle === 9 ? '<!-- Long wavy --> <path d="M28 40 Q25 60 22 80 L78 80 Q75 60 72 40 Z" />' : ''}
        ${hairStyle === 10 ? '<!-- Huge curls --> <circle cx="25" cy="55" r="15" /><circle cx="75" cy="55" r="15" /><circle cx="20" cy="70" r="18" /><circle cx="80" cy="70" r="18" />' : ''}
      </g>

      <!-- Neck & Body -->
      <g>
        <!-- Neck -->
        <path d="M${50 - neckThickness} 60 L${50 - neckThickness} 75 L${50 + neckThickness} 75 L${50 + neckThickness} 60 Z" fill="${selectedSkin}" filter="brightness(0.85)" />
        
        <!-- Clothing -->
        <g fill="${selectedClothing}">
          ${clothingType === 0 ? `<!-- T-Shirt --> <path d="M20 100 L20 85 Q50 70 80 85 L80 100 Z" /><path d="M${50 - neckThickness - 2} 75 Q50 85 ${50 + neckThickness + 2} 75 L${50 + neckThickness + 2} 80 Q50 90 ${50 - neckThickness - 2} 80 Z" fill="${secondaryClothing}" />` : ''}
          ${clothingType === 1 ? `<!-- Collared Shirt --> <path d="M20 100 L20 82 L50 72 L80 82 L80 100 Z" /><path d="M${50 - neckThickness} 73 L40 85 L50 95 L60 85 L${50 + neckThickness} 73 Z" fill="#FFFFFF" /><path d="M48 85 L52 85 L52 100 L48 100 Z" fill="${secondaryClothing}" />` : ''}
          ${clothingType === 2 ? `<!-- Sweater --> <path d="M15 100 L15 80 Q50 65 85 80 L85 100 Z" /><path d="M${50 - neckThickness} 74 Q50 82 ${50 + neckThickness} 74 L${50 + neckThickness} 78 Q50 86 ${50 - neckThickness} 78 Z" fill="${secondaryClothing}" />` : ''}
          ${clothingType === 3 ? `<!-- Suit --> <path d="M15 100 L15 85 Q50 70 85 85 L85 100 Z" /><path d="M${50 - neckThickness} 75 L50 95 L${50 + neckThickness} 75 Z" fill="#FFFFFF" /><path d="M48 80 L52 80 L50 90 Z" fill="#EF4444" />` : ''}
        </g>
      </g>

      <!-- Head Shape -->
      <g fill="${selectedSkin}">
        <!-- Ears -->
        <circle cx="28" cy="52" r="5" fill="${selectedSkin}" filter="brightness(0.9)" />
        <circle cx="72" cy="52" r="5" fill="${selectedSkin}" filter="brightness(0.9)" />
        
        <!-- Main Face -->
        <!-- Flat geometric face, completely pill shaped or oval -->
        ${isMale 
          ? '<path d="M30 35 L30 55 Q30 72 50 72 Q70 72 70 55 L70 35 Z" />' 
          : '<path d="M32 35 L32 55 Q32 70 50 70 Q68 70 68 55 L68 35 Z" />'}
      </g>

      <!-- Blush -->
      ${hasBlush ? `<circle cx="38" cy="55" r="4" fill="#FF8A8A" opacity="0.4" /><circle cx="62" cy="55" r="4" fill="#FF8A8A" opacity="0.4" />` : ''}

      <!-- Eyes & Eyebrows -->
      <g>
        <!-- Eyebrows -->
        <path d="M36 43 Q40 41 44 43" stroke="${selectedHair}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.8" />
        <path d="M56 43 Q60 41 64 43" stroke="${selectedHair}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.8" />
        
        <!-- Eyes -->
        <circle cx="40" cy="49" r="2.5" fill="#111827" />
        <circle cx="60" cy="49" r="2.5" fill="#111827" />
      </g>

      <!-- Nose -->
      <path d="M50 49 L50 56 L53 56" stroke="#111827" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.2" />

      <!-- Mouth -->
      <g stroke="#111827" stroke-linecap="round" fill="none">
        ${rand() > 0.5 
          ? '<!-- Smile --> <path d="M43 62 Q50 67 57 62" stroke-width="1.5" />' 
          : '<!-- Small Smile --> <path d="M46 62 Q50 64 54 62" stroke-width="1.5" />'}
      </g>

      <!-- Facial Hair (Males only) -->
      <g fill="${selectedHair}" opacity="0.85">
        ${facialHairType === 0 ? '<!-- Mustache --> <path d="M42 60 Q50 57 58 60 Q50 62 42 60 Z" />' : ''}
        ${facialHairType === 1 ? '<!-- Handlebar --> <path d="M38 62 Q45 57 50 58 Q55 57 62 62 Q60 59 50 60 Q40 59 38 62 Z" />' : ''}
        ${facialHairType === 2 ? '<!-- Full Beard --> <path d="M30 55 L30 60 Q30 75 50 75 Q70 75 70 60 L70 55 Q70 65 50 65 Q30 65 30 55 Z" /><path d="M42 60 Q50 57 58 60 Q50 62 42 60 Z" />' : ''}
        ${facialHairType === 3 ? '<!-- Goatee --> <path d="M45 64 Q50 69 55 64 L52 72 L48 72 Z" />' : ''}
        ${facialHairType === 4 ? '<!-- Monocle Mustache (Like reference) --> <path d="M40 59 Q50 56 60 59 Q50 61 40 59 Z" />' : ''}
      </g>

      <!-- Top Hair -->
      <g fill="${selectedHair}">
        <!-- Male styles -->
        ${hairStyle === 0 ? '<!-- Short parted --> <path d="M28 40 Q28 20 50 20 Q72 20 72 40 Q72 30 60 28 Q50 28 28 40 Z" />' : ''}
        ${hairStyle === 1 ? '<!-- Swept back --> <path d="M28 42 Q28 15 55 18 Q72 20 72 42 Q65 30 45 28 Q35 30 28 42 Z" />' : ''}
        ${hairStyle === 2 ? '<!-- Buzz --> <path d="M30 38 Q30 22 50 22 Q70 22 70 38 Z" />' : ''}
        ${hairStyle === 3 ? '<!-- Messy spikes --> <path d="M28 40 L35 25 L45 30 L55 20 L65 32 L72 40 Q60 30 50 30 Q40 30 28 40 Z" />' : ''}
        ${hairStyle === 4 ? '<!-- Bald --> <path d="M30 38 Q30 22 50 22 Q70 22 70 38 Z" opacity="0.1" />' : ''}
        ${hairStyle === 5 ? '<!-- Curly top --> <circle cx="40" cy="25" r="8"/><circle cx="50" cy="22" r="9"/><circle cx="60" cy="25" r="8"/><path d="M30 35 Q30 25 50 25 Q70 25 70 35 Z" />' : ''}
        ${hairStyle === 6 ? '<!-- Flat top --> <path d="M30 38 L30 20 L70 20 L70 38 Z" />' : ''}
        ${hairStyle === 7 ? '<!-- Classic swoop --> <path d="M28 40 Q28 15 50 15 Q72 15 72 40 Q60 25 40 28 Q32 30 28 40 Z" />' : ''}
        
        <!-- Female styles -->
        ${hairStyle === 8 ? '<!-- Middle part flat --> <path d="M25 45 Q25 20 50 20 Q75 20 75 45 Q65 35 50 35 Q35 35 25 45 Z" />' : ''}
        ${hairStyle === 9 ? '<!-- Swoop flat --> <path d="M25 45 Q25 18 50 18 Q75 18 75 45 Q60 30 45 30 Q30 30 25 45 Z" />' : ''}
        ${hairStyle === 10 ? '<!-- Big hair top --> <circle cx="35" cy="30" r="15"/><circle cx="50" cy="20" r="16"/><circle cx="65" cy="30" r="15"/><path d="M25 45 Q25 25 50 25 Q75 25 75 45 Z" />' : ''}
        ${hairStyle === 11 ? '<!-- Short bob --> <path d="M25 55 L25 30 Q50 15 75 30 L75 55 Q75 35 50 35 Q25 35 25 55 Z" />' : ''}
        ${hairStyle === 12 ? '<!-- Pixie --> <path d="M28 45 Q28 18 50 18 Q72 18 72 45 Q65 32 45 30 Q35 35 28 45 Z" />' : ''}
        ${hairStyle === 13 ? '<!-- Buns --> <circle cx="20" cy="30" r="10"/><circle cx="80" cy="30" r="10"/><path d="M30 40 Q30 25 50 25 Q70 25 70 40 Z" />' : ''}
        ${hairStyle === 14 ? '<!-- Side sweep --> <path d="M25 50 L25 25 Q50 15 75 35 L75 45 Q60 25 40 30 Q30 35 25 50 Z" />' : ''}
        ${hairStyle === 15 ? '<!-- High Ponytail base --> <circle cx="50" cy="15" r="8"/><path d="M28 40 Q28 20 50 15 Q72 20 72 40 Z" />' : ''}
      </g>

      <!-- Headwear -->
      <g fill="${secondaryClothing}">
        ${headwearType === 0 ? '<!-- Beanie --> <path d="M28 35 Q28 15 50 15 Q72 15 72 35 Z" /><rect x="26" y="32" width="48" height="6" rx="2" />' : ''}
        ${headwearType === 1 ? '<!-- Cap --> <path d="M30 35 Q30 18 50 18 Q70 18 70 35 Z" /><path d="M70 35 L85 35 L85 39 L65 39 Z" />' : ''}
        ${headwearType === 2 ? '<!-- Headband --> <rect x="28" y="30" width="44" height="6" fill="#EF4444" />' : ''}
      </g>

      <!-- Glasses -->
      <g>
        ${glassType === 0 ? '<!-- Sunglasses colorful (Reference style) --> <g><path d="M32 43 L48 43 L46 51 L34 51 Z" fill="#34D399" stroke="#111827" stroke-width="2" stroke-linejoin="round" /><path d="M52 43 L68 43 L66 51 L54 51 Z" fill="#34D399" stroke="#111827" stroke-width="2" stroke-linejoin="round" /><path d="M48 45 L52 45" stroke="#111827" stroke-width="2" /></g>' : ''}
        ${glassType === 1 ? '<!-- Monocle (Reference style) --> <g><circle cx="60" cy="48" r="6" fill="rgba(255,255,255,0.3)" stroke="#FBBF24" stroke-width="2" /><path d="M66 48 L75 48 M60 54 L60 65" stroke="#FBBF24" stroke-width="1.5" /></g>' : ''}
        ${glassType === 2 ? '<!-- Round Glasses --> <g><circle cx="40" cy="48" r="6" fill="rgba(255,255,255,0.2)" stroke="#111827" stroke-width="2" /><circle cx="60" cy="48" r="6" fill="rgba(255,255,255,0.2)" stroke="#111827" stroke-width="2" /><path d="M46 48 L54 48" stroke="#111827" stroke-width="2" /></g>' : ''}
        ${glassType === 3 ? '<!-- Retro Sunglasses --> <g><rect x="32" y="44" width="16" height="10" rx="2" fill="#111827" /><rect x="52" y="44" width="16" height="10" rx="2" fill="#111827" /><path d="M48 46 L52 46" stroke="#111827" stroke-width="2" /></g>' : ''}
      </g>

    </g>
  </svg>`;
}

export function getAvatarDataUrl(seed: string): string {
  const svg = generateAvatarSvg(seed);
  // Important: Use encodeURIComponent to make it a perfectly valid data URL for image sources
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
