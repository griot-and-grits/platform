import axios from 'axios';

import { ADMIN_API_BASE_URL, ADMIN_API_TIMEOUT } from './config';

export const apiClient = axios.create({
    baseURL: ADMIN_API_BASE_URL,
    timeout: ADMIN_API_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});
