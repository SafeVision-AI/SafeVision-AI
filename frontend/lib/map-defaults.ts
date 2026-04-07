export const FALLBACK_MAP_CENTER: [number, number] = [
  Number(process.env.NEXT_PUBLIC_MAP_FALLBACK_LAT ?? 20.5937),
  Number(process.env.NEXT_PUBLIC_MAP_FALLBACK_LON ?? 78.9629),
];

export const FALLBACK_MAP_ZOOM = Number(process.env.NEXT_PUBLIC_MAP_FALLBACK_ZOOM ?? 5);
export const LIVE_MAP_ZOOM = Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM ?? 13);
