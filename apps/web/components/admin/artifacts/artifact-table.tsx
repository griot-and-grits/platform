'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Loader2, RefreshCw } from 'lucide-react';

import { artifactsApi } from '@/lib/admin/apis';
import { ArtifactStatus } from '@/lib/admin/types';
import { formatDate, formatFileSize } from '@/lib/admin/utils/formatters';
import { ArtifactStatusBadge } from '../shared/artifact-status-badge';
import { getAPIErrorMessage } from '@/lib/admin/utils/error';

const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: ArtifactStatus.UPLOADING, label: 'Uploading' },
    { value: ArtifactStatus.PROCESSING, label: 'Processing' },
    { value: ArtifactStatus.READY, label: 'Ready' },
    { value: ArtifactStatus.FAILED, label: 'Failed' },
    { value: ArtifactStatus.ARCHIVED, label: 'Archived' },
];

export function ArtifactTable() {
    const [status, setStatus] = useState<string>('');

    const queryParams = useMemo(
        () => ({
            status: status ? (status as ArtifactStatus) : undefined,
            limit: 50,
        }),
        [status],
    );

    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: ['artifacts', queryParams],
        queryFn: () => artifactsApi.list(queryParams),
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Artifacts</h2>
                    <p className="text-sm text-slate-600">
                        Review ingested files and monitor their preservation status.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {getAPIErrorMessage(error)}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Title
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Size
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Uploaded
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                        {isLoading && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-8 text-center text-sm text-slate-600"
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading artifacts...
                                    </span>
                                </td>
                            </tr>
                        )}

                        {!isLoading &&
                            data?.artifacts?.map((artifact) => (
                                <tr key={`${artifact.artifact_id}-${artifact.uploaded_at ?? artifact.status}`}>
                                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                        {artifact.title || artifact.artifact_id}
                                    </td>
                                    <td className="px-4 py-3">
                                        <ArtifactStatusBadge status={artifact.status} />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {artifact.type ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {formatFileSize(artifact.size_bytes)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {formatDate(artifact.uploaded_at)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm">
                                        <Link
                                            href={`/admin/artifacts/${artifact.artifact_id}`}
                                            className="text-sm font-semibold text-slate-900 hover:underline"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}

                        {!isLoading && data?.artifacts?.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-8 text-center text-sm text-slate-600"
                                >
                                    No artifacts found. Try adjusting filters or ingest a new artifact.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isFetching && !isLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Refreshing…
                </div>
            )}
        </div>
    );
}
