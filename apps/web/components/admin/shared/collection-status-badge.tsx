import { CollectionStatus } from '@/lib/admin/types';

type CollectionStatusBadgeProps = {
    status: CollectionStatus;
};

const statusStyles: Record<CollectionStatus, string> = {
    [CollectionStatus.DRAFT]: 'bg-slate-100 text-slate-700',
    [CollectionStatus.AWAITING_UPLOAD]: 'bg-blue-100 text-blue-700',
    [CollectionStatus.UPLOAD_IN_PROGRESS]: 'bg-blue-100 text-blue-700',
    [CollectionStatus.VERIFYING]: 'bg-yellow-100 text-yellow-700',
    [CollectionStatus.SEALED]: 'bg-green-100 text-green-700',
    [CollectionStatus.ERROR]: 'bg-red-100 text-red-700',
};

const statusLabels: Record<CollectionStatus, string> = {
    [CollectionStatus.DRAFT]: 'Draft',
    [CollectionStatus.AWAITING_UPLOAD]: 'Awaiting Upload',
    [CollectionStatus.UPLOAD_IN_PROGRESS]: 'Uploading',
    [CollectionStatus.VERIFYING]: 'Verifying',
    [CollectionStatus.SEALED]: 'Sealed',
    [CollectionStatus.ERROR]: 'Error',
};

export function CollectionStatusBadge({ status }: CollectionStatusBadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                statusStyles[status] || 'bg-gray-100 text-gray-700'
            }`}
        >
            {statusLabels[status] || status}
        </span>
    );
}
