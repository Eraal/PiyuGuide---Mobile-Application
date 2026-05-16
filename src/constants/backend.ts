const DEFAULT_BACKEND_URL = "https://piyuguide.live";

const configuredBackendUrl = process.env.EXPO_PUBLIC_PIYUGUIDE_BACKEND_URL?.trim();

export const BACKEND_URL = (configuredBackendUrl || DEFAULT_BACKEND_URL).replace(/\/+$/, "");