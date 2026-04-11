import Link from 'next/link';
import { ArrowRight, Box, Upload, Package } from 'lucide-react';

const quickActions = [
    {
        href: '/admin/upload',
        title: 'Ingest Artifact',
        description: 'Upload a new recording with descriptive metadata.',
        icon: <Upload className="h-5 w-5 text-slate-500" />,
    },
    {
        href: '/admin/artifacts',
        title: 'Review Artifacts',
        description: 'Browse processed artifacts and preservation metadata.',
        icon: <Box className="h-5 w-5 text-slate-500" />,
    },
    {
        href: '/admin/packages/create',
        title: 'Start Archive Package',
        description: 'Create a draft package, upload to Globus, and finalize.',
        icon: <Package className="h-5 w-5 text-slate-500" />,
    },
];

export default function AdminDashboardPage() {
    return (
        <div className="space-y-8">
            <section>
                <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                    Use the admin portal to manage digital preservation workflows. Start a draft package,
                    ingest new artifacts, or check fixity and storage locations.
                </p>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                {quickActions.map((action) => (
                    <Link
                        key={action.href}
                        href={action.href}
                        className="group flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                    >
                        <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                                {action.icon}
                            </span>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">{action.title}</h3>
                                <p className="text-xs text-slate-600">{action.description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            Go to page
                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                        </div>
                    </Link>
                ))}
            </section>

            <section className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                    Draft → Upload → Confirm Flow
                </h3>
                <ol className="mt-4 space-y-3 text-sm text-slate-700">
                    <li>
                        <span className="font-semibold text-slate-900">1. Create Draft:</span> Start a
                        new archival package draft to reserve paths and capture metadata.
                    </li>
                    <li>
                        <span className="font-semibold text-slate-900">2. Upload:</span> Use the
                        provided Globus details to upload the package contents.
                    </li>
                    <li>
                        <span className="font-semibold text-slate-900">3. Confirm:</span> Finalize the
                        package to trigger verification and preservation events.
                    </li>
                </ol>
            </section>
        </div>
    );
}
