import { ArtifactStatus } from './types';

const STATUS_STYLES: Record<
    ArtifactStatus,
    { label: string; className: string; dotClassName: string }
> = {
    [ArtifactStatus.UPLOADING]: {
        label: 'Uploading',
        className: 'bg-blue-100 text-blue-800',
        dotClassName: 'bg-blue-500',
    },
    [ArtifactStatus.PROCESSING]: {
        label: 'Processing',
        className: 'bg-yellow-100 text-yellow-800',
        dotClassName: 'bg-yellow-500',
    },
    [ArtifactStatus.READY]: {
        label: 'Ready',
        className: 'bg-green-100 text-green-800',
        dotClassName: 'bg-green-500',
    },
    [ArtifactStatus.FAILED]: {
        label: 'Failed',
        className: 'bg-red-100 text-red-800',
        dotClassName: 'bg-red-500',
    },
    [ArtifactStatus.ARCHIVED]: {
        label: 'Archived',
        className: 'bg-purple-100 text-purple-800',
        dotClassName: 'bg-purple-500',
    },
};

export const getArtifactStatusStyle = (
    status: ArtifactStatus,
): { label: string; className: string; dotClassName: string } =>
    STATUS_STYLES[status] ??
    STATUS_STYLES[ArtifactStatus.PROCESSING];
