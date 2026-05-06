export const ADMIN_API_BASE_URL =
    import.meta.env.VITE_ADMIN_API_BASE_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    'http://localhost:6731';

export const ADMIN_API_TIMEOUT = Number(
    import.meta.env.VITE_ADMIN_API_TIMEOUT ?? 30000,
);

export const ADMIN_DEV_MODE =
    import.meta.env.VITE_ADMIN_DEV_MODE === 'true' ||
    import.meta.env.MODE !== 'production';
