import { ArtifactDetail } from '@/components/admin/artifacts/artifact-detail';

type ArtifactDetailPageProps = {
    params: Promise<{ artifactId: string }>;
};

export default async function ArtifactDetailPage({ params }: ArtifactDetailPageProps) {
    const { artifactId } = await params;

    return <ArtifactDetail artifactId={artifactId} />;
}
