'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Loader2, RefreshCw } from 'lucide-react';

import { collectionsApi } from '@/lib/admin/apis';
import { CollectionStatus } from '@/lib/admin/types';
import { formatDate } from '@/lib/admin/utils/formatters';
import { CollectionStatusBadge } from '../shared/collection-status-badge';
import { getAPIErrorMessage } from '@/lib/admin/utils/error';

const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: CollectionStatus.DRAFT, label: 'Draft' },
    { value: CollectionStatus.AWAITING_UPLOAD, label: 'Awaiting Upload' },
    { value: CollectionStatus.UPLOAD_IN_PROGRESS, label: 'Upload In Progress' },
    { value: CollectionStatus.VERIFYING, label: 'Verifying' },
    { value: CollectionStatus.SEALED, label: 'Sealed' },
    { value: CollectionStatus.ERROR, label: 'Error' },
];

export function CollectionTable() {
    const [status, setStatus] = useState<string>('');

    const queryParams = useMemo(
        () => ({
            status: status ? (status as CollectionStatus) : undefined,
            limit: 50,
        }),
        [status],
    );

    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: ['collections', queryParams],
        queryFn: () => collectionsApi.list(queryParams),
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Collections</h2>
                    <p className="text-sm text-slate-600">
                        Archive collections for long-term preservation in Globus storage.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value || 'all'} value={option.value}>
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
                    <Link
                        href="/admin/collections/create"
                        className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        Create Collection
                    </Link>
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
                                Artifacts
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Size
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Created
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
                                        Loading collections...
                                    </span>
                                </td>
                            </tr>
                        )}

                        {!isLoading &&
                            data?.collections?.map((collection) => (
                                <tr key={collection.collection_id}>
                                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                        {collection.title || collection.collection_id}
                                    </td>
                                    <td className="px-4 py-3">
                                        <CollectionStatusBadge status={collection.status} />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {collection.artifact_ids?.length ?? 0}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        -
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {formatDate(collection.created_at)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm">
                                        <Link
                                            href={`/admin/collections/${collection.collection_id}`}
                                            className="text-sm font-semibold text-slate-900 hover:underline"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}

                        {!isLoading && data?.collections?.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-8 text-center text-sm text-slate-600"
                                >
                                    No collections found. Try adjusting filters or create a new collection.
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
