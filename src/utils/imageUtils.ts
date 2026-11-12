// Image Utility for High-Reliability Rendering in All Environments (Dev, Prod, Cloud Run)

export function getCinematicFallbackSvg(label: string = 'Cinema Frame', seed: number = 1): string {
  const hues = [
    ['#1a103c', '#0d1527', '#8b5cf6', '#06b6d4'],
    ['#121829', '#080c14', '#06b6d4', '#3b82f6'],
    ['#26122a', '#100a1c', '#ec4899', '#8b5cf6'],
    ['#0f172a', '#020617', '#10b981', '#06b6d4'],
  ];
  const [c1, c2, c3, c4] = hues[seed % hues.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${c3}" />
        <stop offset="100%" stop-color="${c4}" />
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="800" height="450" fill="url(#bg)"/>
    <rect width="800" height="450" fill="url(#grid)"/>
    
    <!-- Cinematic Aspect Letterbox Lines -->
    <line x1="40" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
    <line x1="40" y1="40" x2="40" y2="100" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
    <line x1="760" y1="40" x2="700" y2="40" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
    <line x1="760" y1="40" x2="760" y2="100" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
    <line x1="40" y1="410" x2="100" y2="410" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
    <line x1="40" y1="410" x2="40" y2="350" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
    <line x1="760" y1="410" x2="700" y2="410" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
    <line x1="760" y1="410" x2="760" y2="350" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
    
    <!-- Central Cinematic Reticle -->
    <circle cx="400" cy="225" r="90" fill="none" stroke="url(#accent)" stroke-width="2" stroke-dasharray="6 4" opacity="0.6"/>
    <circle cx="400" cy="225" r="6" fill="${c3}"/>
    
    <!-- Text Elements -->
    <text x="400" y="195" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="20" fill="#ffffff" text-anchor="middle" letter-spacing="3">
      FILM &amp; VIDEO STUDIO
    </text>
    <text x="400" y="270" font-family="monospace" font-weight="600" font-size="13" fill="${c4}" text-anchor="middle" letter-spacing="1">
      ${label.replace(/[<>&"]/g, '')}
    </text>
    <text x="400" y="295" font-family="monospace" font-size="10" fill="rgba(255,255,255,0.4)" text-anchor="middle">
      24.00 FPS · 35mm ANAMORPHIC DCI
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function resolveAssetUrl(url?: string, label: string = 'Scene Frame'): string {
  if (!url) return getCinematicFallbackSvg(label);
  
  // If it's already a full data URI or http link, return it
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Ensure root-relative assets are correctly formed
  return url;
}

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, label: string = 'Scene Frame', seed: number = 1) {
  const target = e.currentTarget;
  // If it failed loading /src/assets/..., try /assets/... before falling back to SVG
  if (target.src.includes('/src/assets/images/')) {
    target.src = target.src.replace('/src/assets/images/', '/assets/images/');
    return;
  }
  target.onerror = null; // Prevent loop
  target.src = getCinematicFallbackSvg(label, seed);
}
