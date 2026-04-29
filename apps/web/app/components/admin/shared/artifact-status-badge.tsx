import { getArtifactStatusStyle } from '@/lib/admin/status';
import { ArtifactStatus } from '@/lib/admin/types';

type ArtifactStatusBadgeProps = {
    status: ArtifactStatus;
};

export function ArtifactStatusBadge({ status }: ArtifactStatusBadgeProps) {
    const { label, className, dotClassName } = getArtifactStatusStyle(status);

    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${className}`}
        >
            <span className={`h-2 w-2 rounded-full ${dotClassName}`} aria-hidden="true" />
            {label}
        </span>
    );
}
