import axios from 'axios';

export const getAPIErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        if (error.response?.data && typeof error.response.data === 'object') {
            const detail =
                (error.response.data as { detail?: string; message?: string }).detail ??
                (error.response.data as { message?: string }).message;

            if (detail) {
                return detail;
            }
        }

        if (error.code === 'ECONNABORTED') {
            return 'Request timed out. Please try again.';
        }

        if (error.code === 'ERR_NETWORK') {
            return 'Network error. Please verify connectivity to the preservation API.';
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'Unexpected error occurred. Please try again.';
};
