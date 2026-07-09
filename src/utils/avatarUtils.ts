export const generateInitialsAvatar = (name: string): string => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2) || '?';
  
  // Beautiful dynamic gradients matching the Aver theme (emerald, teal, blue, indigo, violet)
  const gradientPairs = [
    { start: '#10b981', end: '#059669' }, // Emerald to Dark Emerald
    { start: '#06b6d4', end: '#0891b2' }, // Cyan to Dark Cyan
    { start: '#3b82f6', end: '#1d4ed8' }, // Blue to Dark Blue
    { start: '#6366f1', end: '#4338ca' }, // Indigo to Dark Indigo
    { start: '#8b5cf6', end: '#6d28d9' }, // Violet to Dark Violet
    { start: '#ec4899', end: '#be185d' }, // Pink to Dark Pink
    { start: '#f43f5e', end: '#be123c' }, // Rose to Dark Rose
    { start: '#14b8a6', end: '#0d9488' }, // Teal to Dark Teal
  ];
  
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradientPairs.length;
  const gradient = gradientPairs[index];
  
  const svg = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#grad)" />
    <text x="50%" y="50%" font-family="system-ui, -apple-system, sans-serif" font-weight="bold" font-size="38" fill="white" text-anchor="middle" dy=".3em">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};
