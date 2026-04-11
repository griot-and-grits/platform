export const ADMIN_API_BASE_URL =
    process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://localhost:8009';

export const ADMIN_API_TIMEOUT = Number(
    process.env.NEXT_PUBLIC_ADMIN_API_TIMEOUT ?? 30000,
);

export const ADMIN_DEV_MODE =
    process.env.NEXT_PUBLIC_ADMIN_DEV_MODE === 'true' ||
    process.env.NODE_ENV !== 'production';
