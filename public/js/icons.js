// Fixed icon + color presets. Kept as a closed set (rather than free-form
// SVG/HTML from the admin form) so admin-authored content can never inject
// arbitrary markup into the public site.

export const ICONS = {
  code: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  shield:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  bot: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V5"/><circle cx="12" cy="4" r="1"/><path d="M9 13v2M15 13v2M2 14h2M20 14h2"/></svg>',
  chart:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',
  globe:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z"/></svg>',
};

export const COLORS = {
  cyan: {
    text: "text-neon-cyan",
    border: "hover:border-neon-cyan/60",
    grad: "from-neon-cyan/20 to-neon-cyan/0",
    label: "Cyan",
  },
  green: {
    text: "text-neon-green",
    border: "hover:border-neon-green/60",
    grad: "from-neon-green/20 to-neon-green/0",
    label: "Green",
  },
  violet: {
    text: "text-neon-violet",
    border: "hover:border-neon-violet/60",
    grad: "from-neon-violet/20 to-neon-violet/0",
    label: "Violet",
  },
  fuchsia: {
    text: "text-neon-fuchsia",
    border: "hover:border-neon-fuchsia/60",
    grad: "from-neon-fuchsia/20 to-neon-fuchsia/0",
    label: "Fuchsia",
  },
};

export function iconSvg(key) {
  return ICONS[key] || ICONS.code;
}

export function colorSet(key) {
  return COLORS[key] || COLORS.cyan;
}
