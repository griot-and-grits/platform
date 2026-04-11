'use client';

import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle, Clipboard, ClipboardCheck, Loader2 } from 'lucide-react';
import { z } from 'zod';

import { collectionsApi } from '@/lib/admin/apis';
import type { CollectionDraftResponse, Collection } from '@/lib/admin/types';
import { getAPIErrorMessage } from '@/lib/admin/utils/error';
import { formatDate } from '@/lib/admin/utils/formatters';

const draftSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    expected_artifact_count: z
        .string()
        .optional()
        .refine(
            (value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0),
            {
                message: 'Expected artifact count must be a positive number.',
            },
        ),
    tags: z.string().optional(),
});

type DraftFormValues = z.infer<typeof draftSchema>;

export function CollectionDraftFlow() {
    const router = useRouter();
    const [draft, setDraft] = useState<CollectionDraftResponse | null>(null);
    const [finalizedPackage, setFinalizedPackage] = useState<Collection | null>(null);
    const [uploadedConfirmed, setUploadedConfirmed] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const form = useForm<DraftFormValues>({
        resolver: zodResolver(draftSchema),
        defaultValues: {
            title: '',
            description: '',
            expected_artifact_count: '',
            tags: '',
        },
    });

    const generatedSlug = generateSlug(form.watch('title') ?? '');

    const createDraftMutation = useMutation({
        mutationFn: (payload: DraftFormValues) =>
            collectionsApi.createDraft({
                title: payload.title,
                description: optionalString(payload.description),
                slug: generatedSlug || undefined,
                expected_artifact_count: payload.expected_artifact_count
                    ? Number(payload.expected_artifact_count)
                    : undefined,
                tags: splitToArray(payload.tags),
            }),
        onSuccess: (response) => {
            setDraft(response);
            setUploadedConfirmed(false);
            setFinalizedPackage(null);
        },
    });

    const finalizeMutation = useMutation({
        mutationFn: (packageId: string) => collectionsApi.finalize(packageId),
        onSuccess: (result) => {
            setFinalizedPackage(result);
        },
    });

    const handleSubmit = (values: DraftFormValues) => {
        createDraftMutation.mutate(values);
    };

    const handleFinalize = () => {
        if (!draft) return;
        finalizeMutation.mutate(draft.collection_id);
    };

    const handleCopy = async (value: string, field: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (error) {
            console.error('Clipboard copy failed', error);
        }
    };

    return (
        <div className="space-y-8">
            <section>
                <h1 className="text-2xl font-semibold text-slate-900">Create Archive Package</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                    Reserve an upload path, capture package metadata, then upload assets before finalizing.
                    This implements the draft → upload → confirm workflow agreed with the backend.
                </p>
            </section>

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700" htmlFor="title">
                            Title
                        </label>
                        <input
                            id="title"
                            type="text"
                            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            {...form.register('title')}
                        />
                        {form.formState.errors.title && (
                            <p className="mt-1 text-xs text-red-600">
                                {form.formState.errors.title.message}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                            Slug: <span className="font-mono text-slate-700">{generatedSlug || '—'}</span>
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <label
                            className="block text-sm font-medium text-slate-700"
                            htmlFor="description"
                        >
                            Description
                        </label>
                        <textarea
                            id="description"
                            rows={3}
                            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            {...form.register('description')}
                        />
                    </div>
                    <div>
                        <label
                            className="block text-sm font-medium text-slate-700"
                            htmlFor="expected_artifact_count"
                        >
                            Expected artifact count
                        </label>
                        <input
                            id="expected_artifact_count"
                            type="number"
                            min={0}
                            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            {...form.register('expected_artifact_count')}
                        />
                        {form.formState.errors.expected_artifact_count && (
                            <p className="mt-1 text-xs text-red-600">
                                {form.formState.errors.expected_artifact_count.message}
                            </p>
                        )}
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700" htmlFor="tags">
                            Tags
                        </label>
                        <input
                            id="tags"
                            type="text"
                            placeholder="Comma separated tags"
                            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            {...form.register('tags')}
                        />
                    </div>
                </div>

                {createDraftMutation.isError && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {getAPIErrorMessage(createDraftMutation.error)}
                    </div>
                )}

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => form.reset()}
                        className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                        Clear form
                    </button>
                    <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        disabled={createDraftMutation.isPending}
                    >
                        {createDraftMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Create draft
                    </button>
                </div>
            </form>

            {draft && (
                <section className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Upload instructions
                            </h2>
                            <p className="text-sm text-slate-600">
                                Upload the prepared package contents via Globus, then mark upload complete.
                            </p>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Draft created {formatDate(draft.created_at)}
                        </span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <InstructionCard
                            label="Package ID"
                            value={draft.collection_id}
                            onCopy={() => handleCopy(draft.collection_id, 'collection_id')}
                            copied={copiedField === 'collection_id'}
                        />
                        <InstructionCard
                            label="Globus Endpoint ID"
                            value={draft.globus_endpoint_id}
                            onCopy={() => handleCopy(draft.globus_endpoint_id, 'endpoint')}
                            copied={copiedField === 'endpoint'}
                        />
                        <InstructionCard
                            className="md:col-span-2"
                            label="Upload Path (raw/)"
                            value={draft.raw_upload_path}
                            onCopy={() => handleCopy(draft.raw_upload_path, 'raw_upload_path')}
                            copied={copiedField === 'raw_upload_path'}
                        />
                        <div className="md:col-span-2 rounded-md border border-slate-200 bg-white p-4">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="text-sm font-semibold text-slate-900">Upload Link</h3>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(draft.globus_link, 'globus_link')}
                                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                    {copiedField === 'globus_link' ? (
                                        <>
                                            <ClipboardCheck className="h-3 w-3" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Clipboard className="h-3 w-3" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                            <a
                                href={draft.globus_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                                Open in Globus File Manager
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                </svg>
                            </a>
                        </div>
                    </div>
                    <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                        <p className="font-semibold">Next steps</p>
                        <ol className="mt-2 list-decimal space-y-1 pl-4">
                            <li>Click the link above to open Globus File Manager (opens directly to raw/ folder)</li>
                            <li>Upload your files to the raw/ folder</li>
                            <li>Check the box below and finalize when upload is complete</li>
                        </ol>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                checked={uploadedConfirmed}
                                onChange={(event) => setUploadedConfirmed(event.target.checked)}
                            />
                            I have finished uploading the package contents.
                        </label>
                        <button
                            type="button"
                            onClick={handleFinalize}
                            disabled={!uploadedConfirmed || finalizeMutation.isPending}
                            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            {finalizeMutation.isPending && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            Finalize package
                        </button>
                    </div>
                    {finalizeMutation.isError && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {getAPIErrorMessage(finalizeMutation.error)}
                        </div>
                    )}
                </section>
            )}

            {finalizedPackage && (
                <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
                    <div className="flex items-center gap-2 text-base font-semibold">
                        <CheckCircle className="h-5 w-5" />
                        Package sealed successfully.
                    </div>
                    <p className="mt-2">
                        Package <span className="font-semibold">{finalizedPackage.collection_id}</span> is now
                        {` ${finalizedPackage.status}`} and ready for archival workflows.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => router.push('/admin/packages/create')}
                            className="rounded-md border border-emerald-200 px-3 py-1 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                        >
                            Start another package
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/admin')}
                            className="rounded-md border border-emerald-200 px-3 py-1 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                        >
                            Return to dashboard
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
}

type InstructionCardProps = {
    label: string;
    value: string;
    multiline?: boolean;
    copied: boolean;
    onCopy: () => void;
    className?: string;
};

function InstructionCard({
    label,
    value,
    multiline,
    copied,
    onCopy,
    className,
}: InstructionCardProps) {
    return (
        <div className={`rounded-md border border-slate-200 bg-white p-4 ${className ?? ''}`}>
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
                <button
                    type="button"
                    onClick={onCopy}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                    {copied ? (
                        <>
                            <ClipboardCheck className="h-3 w-3" />
                            Copied
                        </>
                    ) : (
                        <>
                            <Clipboard className="h-3 w-3" />
                            Copy
                        </>
                    )}
                </button>
            </div>
            <p
                className={`mt-2 text-sm text-slate-700 ${
                    multiline ? 'whitespace-pre-wrap' : 'font-mono break-all'
                }`}
            >
                {value}
            </p>
        </div>
    );
}

const optionalString = (value?: string | null) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
};

const MAX_SLUG_LENGTH = 64;

const generateSlug = (value: string) => {
    const normalized = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    return normalized.slice(0, MAX_SLUG_LENGTH);
};

const splitToArray = (value?: string | null) => {
    if (!value) return undefined;

    const entries = value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

    return entries.length ? entries : undefined;
};
