'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertTriangle } from 'lucide-react';

import { artifactsApi, preservationApi } from '@/lib/admin/apis';
import type { Artifact } from '@/lib/admin/types';
import { ArtifactStatus } from '@/lib/admin/types';
import { formatDate, formatFileSize, formatRelativeDate } from '@/lib/admin/utils/formatters';
import { ArtifactStatusBadge } from '../shared/artifact-status-badge';
import { getAPIErrorMessage } from '@/lib/admin/utils/error';

type ArtifactDetailProps = {
    artifactId: string;
};

const extractMetadata = (artifact: Artifact) => ({
    description: artifact.description ?? '—',
    creator: artifact.creator ?? '—',
    creation_date: artifact.creation_date ? formatDate(artifact.creation_date) : '—',
    type: artifact.type ?? '—',
    format: artifact.format ?? artifact.file_extension ?? '—',
    language: artifact.language?.join(', ') ?? '—',
    subject: artifact.subject?.join(', ') ?? '—',
    rights: artifact.rights ?? '—',
});

const metadataFields: Array<{ key: keyof ReturnType<typeof extractMetadata>; label: string }> = [
    { key: 'description', label: 'Description' },
    { key: 'creator', label: 'Creator' },
    { key: 'creation_date', label: 'Creation Date' },
    { key: 'type', label: 'Type' },
    { key: 'format', label: 'Format' },
    { key: 'language', label: 'Language' },
    { key: 'subject', label: 'Subject' },
    { key: 'rights', label: 'Rights' },
];

export function ArtifactDetail({ artifactId }: ArtifactDetailProps) {
    const {
        data: artifact,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ['artifact', artifactId],
        queryFn: () => artifactsApi.getById(artifactId),
        refetchInterval: (query) => {
            if (!query.state.data) {
                return 5000;
            }

            if (
                query.state.data.status === ArtifactStatus.PROCESSING ||
                query.state.data.status === ArtifactStatus.UPLOADING
            ) {
                return 5000;
            }

            return false;
        },
    });

    const storageQuery = useQuery({
        queryKey: ['artifact-storage', artifactId],
        queryFn: () => preservationApi.getStorageLocations(artifactId),
        enabled: Boolean(artifactId),
    });

    const eventsQuery = useQuery({
        queryKey: ['artifact-events', artifactId],
        queryFn: () => preservationApi.getEvents(artifactId),
        enabled: Boolean(artifactId),
    });

    const fixityQuery = useQuery({
        queryKey: ['artifact-fixity', artifactId],
        queryFn: () => preservationApi.getFixity(artifactId),
        enabled: Boolean(artifactId),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16 text-sm text-slate-600">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading artifact details…
            </div>
        );
    }

    if (error || !artifact) {
        return (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-800">
                {getAPIErrorMessage(error) || 'Artifact not found.'}
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="ml-3 rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-800 hover:bg-red-100"
                >
                    Retry
                </button>
            </div>
        );
    }

    const metadata = extractMetadata(artifact);

    return (
        <div className="space-y-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Artifact ID</p>
                    <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                        {artifact.title || artifact.artifact_id}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">#{artifact.artifact_id}</p>
                </div>
                <ArtifactStatusBadge status={artifact.status} />
            </header>

            {(artifact.status === ArtifactStatus.PROCESSING ||
                artifact.status === ArtifactStatus.UPLOADING) && (
                <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                    This artifact is still processing. Metadata and preservation information will
                    update automatically. Last updated {formatRelativeDate(artifact.uploaded_at)}.
                </div>
            )}

            {artifact.status === ArtifactStatus.FAILED && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <div className="flex items-center gap-2 font-semibold">
                        <AlertTriangle className="h-4 w-4" />
                        Processing failed. Check the preservation events for more details.
                    </div>
                </div>
            )}

            <section className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                        Metadata
                    </h2>
                    <dl className="mt-4 space-y-3 text-sm text-slate-700">
                        {metadataFields.map(({ key, label }) => (
                            <div key={key}>
                                <dt className="font-medium text-slate-600">{label}</dt>
                                <dd className="text-slate-900">{metadata[key]}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                        File Information
                    </h2>
                    <dl className="mt-4 space-y-3 text-sm text-slate-700">
                        <div>
                            <dt className="font-medium text-slate-600">Original Filename</dt>
                            <dd className="text-slate-900 break-words">{artifact.original_filename}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-600">File Extension</dt>
                            <dd className="text-slate-900">{artifact.file_extension}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-600">MIME Type</dt>
                            <dd className="text-slate-900">{artifact.mime_type ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-600">Size</dt>
                            <dd className="text-slate-900">{formatFileSize(artifact.size_bytes)}</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-slate-600">Uploaded</dt>
                            <dd className="text-slate-900">
                                {formatDate(artifact.uploaded_at)}{' '}
                                <span className="text-slate-500">
                                    {artifact.uploaded_at && `(${formatRelativeDate(artifact.uploaded_at)})`}
                                </span>
                            </dd>
                        </div>
                    </dl>
                </div>
            </section>

            <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                    Storage Locations
                </h2>
                <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-3 text-left">Type</th>
                                <th className="px-4 py-3 text-left">Path</th>
                                <th className="px-4 py-3 text-left">Size</th>
                                <th className="px-4 py-3 text-left">Stored</th>
                                <th className="px-4 py-3 text-left">Verified</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {storageQuery.isLoading && (
                                <tr>
                                    <td className="px-4 py-4 text-sm text-slate-600" colSpan={5}>
                                        <span className="inline-flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading storage locations…
                                        </span>
                                    </td>
                                </tr>
                            )}
                            {!storageQuery.isLoading &&
                                storageQuery.data?.map((location) => (
                                    <tr key={`${location.storage_type}-${location.path}`}>
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            {location.storage_type}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">{location.path}</td>
                                        <td className="px-4 py-3 text-slate-700">
                                            {formatFileSize(location.size_bytes)}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">
                                            {formatDate(location.stored_at)}
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">
                                            {formatDate(location.verified_at)}
                                        </td>
                                    </tr>
                                ))}
                            {!storageQuery.isLoading && storageQuery.data?.length === 0 && (
                                <tr>
                                    <td className="px-4 py-4 text-sm text-slate-600" colSpan={5}>
                                        No storage locations reported yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                        Preservation Events
                    </h2>
                    <div className="mt-3 space-y-3">
                        {eventsQuery.isLoading && (
                            <div className="text-sm text-slate-600">
                                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                                Loading events…
                            </div>
                        )}

                        {!eventsQuery.isLoading &&
                            eventsQuery.data?.map((event) => (
                                <div
                                    key={`${event.event_type}-${event.timestamp}`}
                                    className="rounded-md border border-slate-200 bg-white p-3 text-sm"
                                >
                                    <p className="font-semibold text-slate-900">
                                        {event.event_type} • {event.outcome}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {formatDate(event.timestamp)} ({formatRelativeDate(event.timestamp)})
                                    </p>
                                    {event.detail && (
                                        <p className="mt-2 text-slate-700">{event.detail}</p>
                                    )}
                                </div>
                            ))}

                        {!eventsQuery.isLoading && eventsQuery.data?.length === 0 && (
                            <p className="text-sm text-slate-600">No preservation events yet.</p>
                        )}
                    </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                        Fixity
                    </h2>
                    {fixityQuery.isLoading && (
                        <div className="mt-3 text-sm text-slate-600">
                            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                            Loading fixity information…
                        </div>
                    )}
                    {!fixityQuery.isLoading && fixityQuery.data && (
                        <dl className="mt-3 space-y-3 text-sm text-slate-700">
                            <div>
                                <dt className="font-medium text-slate-600">Algorithms</dt>
                                <dd className="font-mono text-xs text-slate-900">
                                    {fixityQuery.data.algorithm}
                                </dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-600">MD5</dt>
                                <dd className="font-mono text-xs text-slate-900 break-words">
                                    {fixityQuery.data.checksum_md5}
                                </dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-600">SHA-256</dt>
                                <dd className="font-mono text-xs text-slate-900 break-words">
                                    {fixityQuery.data.checksum_sha256}
                                </dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-600">Calculated</dt>
                                <dd className="text-slate-900">{formatDate(fixityQuery.data.calculated_at)}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-600">Verified</dt>
                                <dd className="text-slate-900">{formatDate(fixityQuery.data.verified_at)}</dd>
                            </div>
                        </dl>
                    )}
                    {!fixityQuery.isLoading && !fixityQuery.data && (
                        <p className="mt-3 text-sm text-slate-600">
                            No fixity records yet. Run a fixity check after ingestion completes.
                        </p>
                    )}
                </div>
            </section>

            {artifact.processing_metadata && Object.keys(artifact.processing_metadata).length > 0 && (
                <section>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                        Processing Metadata
                    </h2>
                    <pre className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-900 p-4 text-xs text-slate-100">
                        {JSON.stringify(artifact.processing_metadata, null, 2)}
                    </pre>
                </section>
            )}
        </div>
    );
}
