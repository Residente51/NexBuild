import { notFound } from "next/navigation";
import { ComponentDetailView } from "@/components/catalog/ComponentDetailView";
import { fetchComponentBySlug } from "@/lib/components/repository";

export default async function ComponentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await fetchComponentBySlug(slug);

  if (!result.success) {
    throw new Error(result.error);
  }

  if (!result.data) {
    notFound();
  }

  return <ComponentDetailView component={result.data} />;
}
