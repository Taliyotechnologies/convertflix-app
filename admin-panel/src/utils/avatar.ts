export function initialFromName(name?: string): string {
  const n = (name || '').trim();
  if (!n) return '?';
  return n.charAt(0).toUpperCase();
}

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0; // Convert to 32bit integer
  }
  return Math.abs(h);
}

function hsl(h: number, s: number, l: number) {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function generateAvatar(name?: string, size = 128): string {
  const label = initialFromName(name);
  const hash = hashCode(name || 'user');
  const hue = hash % 360;
  const bg = hsl(hue, 70, 50);
  const fontSize = Math.round(size * 0.52);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="100%" height="100%" rx="${Math.round(size * 0.2)}" fill="${bg}"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#FFFFFF">${label}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
