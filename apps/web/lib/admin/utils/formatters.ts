import { format, formatDistanceToNow } from 'date-fns';

export const formatFileSize = (bytes?: number | null): string => {
    if (!bytes || bytes <= 0) {
        return '0 Bytes';
    }

    const kb = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const index = Math.floor(Math.log(bytes) / Math.log(kb));

    return `${parseFloat((bytes / Math.pow(kb, index)).toFixed(2))} ${sizes[index]}`;
};

export const formatDate = (isoString?: string | null): string => {
    if (!isoString) {
        return '—';
    }

    const date = new Date(isoString);

    if (Number.isNaN(date.getTime())) {
        return isoString;
    }

    return format(date, 'MMM dd, yyyy HH:mm');
};

export const formatRelativeDate = (isoString?: string | null): string => {
    if (!isoString) {
        return '';
    }

    const date = new Date(isoString);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return formatDistanceToNow(date, { addSuffix: true });
};
