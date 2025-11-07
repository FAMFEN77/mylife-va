const FALLBACK_APP_NAME = "Taskee";
const FALLBACK_APP_URL = "http://localhost:4001";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? FALLBACK_APP_NAME;
export const BRAND_SHORT = process.env.NEXT_PUBLIC_BRAND_SHORT ?? APP_NAME;
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? FALLBACK_APP_URL;

export const BRAND_INITIALS =
  BRAND_SHORT.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() ||
  APP_NAME.slice(0, 2).toUpperCase();
