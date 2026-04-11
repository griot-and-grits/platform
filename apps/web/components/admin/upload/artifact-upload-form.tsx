'use client';

import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, UploadCloud } from 'lucide-react';
import { z } from 'zod';

import { artifactsApi } from '@/lib/admin/apis';
import type { IngestionMetadata } from '@/lib/admin/types';
import { getAPIErrorMessage } from '@/lib/admin/utils/error';

const ingestionFormSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    creator: z.string().optional(),
    creation_date: z.string().optional(),
    type: z.string().optional(),
    format: z.string().optional(),
    language: z.string().optional(),
    subject: z.string().optional(),
    rights: z.string().optional(),
});

type IngestionFormValues = z.infer<typeof ingestionFormSchema>;

export function ArtifactUploadForm() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    const form = useForm<IngestionFormValues>({
        resolver: zodResolver(ingestionFormSchema),
        defaultValues: {
            title: '',
            description: '',
            creator: '',
            creation_date: '',
            type: '',
            format: '',
            language: '',
            subject: '',
            rights: '',
        },
    });

    const ingestionMutation = useMutation({
        mutationFn: async (payload: { file: File; metadata: IngestionMetadata }) =>
            artifactsApi.ingest(payload.file, payload.metadata, {
                onUploadProgress: (event) => {
                    if (event.total) {
                        setUploadProgress(Math.round((event.loaded / event.total) * 100));
                    }
                },
            }),
        onSuccess: (response) => {
            router.push(`/admin/artifacts/${response.artifact_id}`);
        },
    });

    const onSubmit = (values: IngestionFormValues) => {
        if (!file) {
            form.setError('title', {
                type: 'manual',
                message: 'Select a file before uploading.',
            });
            return;
        }

        const metadata: IngestionMetadata = {
            title: values.title,
            description: emptyToUndefined(values.description),
            creator: emptyToUndefined(values.creator),
            creation_date: emptyToUndefined(values.creation_date),
            type: emptyToUndefined(values.type),
            format: emptyToUndefined(values.format),
            language: splitToArray(values.language),
            subject: splitToArray(values.subject),
            rights: emptyToUndefined(values.rights),
        };

        ingestionMutation.mutate({ file, metadata });
    };

    const busy = ingestionMutation.isPending;

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <section className="space-y-4">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Upload artifact</h2>
                    <p className="text-sm text-slate-600">
                        Drag and drop the audio, video, or document file to ingest it and record metadata.
                    </p>
                </div>

                <label
                    htmlFor="fileUpload"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition hover:border-slate-400"
                >
                    <UploadCloud className="h-10 w-10 text-slate-400" />
                    <p className="mt-4 text-sm font-semibold text-slate-900">
                        {file ? file.name : 'Choose a file or drag it here'}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                        Supports large files. The backend performs checksum validation and multi-tier storage.
                    </p>
                    <input
                        id="fileUpload"
                        name="fileUpload"
                        type="file"
                        className="hidden"
                        onChange={(event) => {
                            const selectedFile = event.target.files?.[0];
                            if (selectedFile) {
                                setFile(selectedFile);
                            }
                        }}
                    />
                </label>
            </section>

            <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                    Metadata
                </h3>
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
                            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            rows={3}
                            {...form.register('description')}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700" htmlFor="creator">
                            Creator
                        </label>
                        <input
                            id="creator"
                            type="text"
                            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            {...form.register('creator')}
                        />
                    </div>
                    <div>
                        <label
                            className="block text-sm font-medium text-slate-700"
                            htmlFor="creation_date"
                        >
                            Creation Date
                        </label>
                        <input
                            id="creation_date"
                            type="date"
                            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            {...form.register('creation_date')}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700" htmlFor="type">
                            Type
                        </label>
                        <select
                            id="type"
                            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            {...form.register('type')}
                        >
                            <option value="">Select type</option>
                            <option value="audio">Audio</option>
                            <option value="video">Video</option>
                            <option value="image">Image</option>
                            <option value="document">Document</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700" htmlFor="format">
                            Format (e.g., mp4)
                        </label>
                        <input
                            id="format"
                            type="text"
                            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            {...form.register('format')}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700" htmlFor="language">
                            Language(s)
                        </label>
                        <input
                            id="language"
                            type="text"
                            placeholder="Comma separated (e.g., English, Spanish)"
                            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            {...form.register('language')}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700" htmlFor="subject">
                            Subjects / Tags
                        </label>
                        <input
                            id="subject"
                            type="text"
                            placeholder="Comma separated tags"
                            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            {...form.register('subject')}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700" htmlFor="rights">
                            Rights
                        </label>
                        <textarea
                            id="rights"
                            rows={2}
                            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            {...form.register('rights')}
                        />
                    </div>
                </div>
            </section>

            {busy && (
                <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                    <div className="flex items-center justify-between">
                        <span>
                            Uploading… {uploadProgress > 0 && `${uploadProgress}%`}
                        </span>
                        <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                </div>
            )}

            {ingestionMutation.isError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {getAPIErrorMessage(ingestionMutation.error)}
                </div>
            )}

            <div className="flex items-center justify-end gap-3">
                <button
                    type="button"
                    className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    onClick={() => {
                        form.reset();
                        setFile(null);
                        setUploadProgress(0);
                    }}
                >
                    Reset
                </button>
                <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    Upload Artifact
                </button>
            </div>
        </form>
    );
}

const emptyToUndefined = (value?: string | null) => {
    if (!value) {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
};

const splitToArray = (value?: string | null) => {
    if (!value) {
        return undefined;
    }
    const entries = value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

    return entries.length ? entries : undefined;
};
