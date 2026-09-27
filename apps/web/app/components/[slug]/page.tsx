import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ComponentDetailView } from "@/components/catalog/ComponentDetailView";
import { CATEGORY_LABELS } from "@/lib/categories";
import { fetchComponentBySlug } from "@/lib/components/repository";
import { getTechnicalSpecifications } from "@/lib/components/specifications";

const getComponentBySlug = cache(fetchComponentBySlug);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getComponentBySlug(slug);

  if (!result.success || !result.data) {
    return {
      title: "Componente no disponible",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const component = result.data;
  const specifications = getTechnicalSpecifications(component)
    .slice(0, 3)
    .map(({ label, value }) => `${label}: ${value}`)
    .join(". ");
  const category = CATEGORY_LABELS[component.category].toLocaleLowerCase("es-CL");
  const description = [
    `${component.name} de ${component.brand}, ${category}`,
    specifications,
  ]
    .filter(Boolean)
    .join(". ")
    .concat(".");
  const path = `/components/${encodeURIComponent(component.slug)}`;
  const images = component.image ? [{ url: component.image }] : undefined;

  return {
    title: `${component.name} de ${component.brand}`,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      url: path,
      title: `${component.name} de ${component.brand}`,
      description,
      images,
    },
    ...(component.image
      ? {
          twitter: {
            card: "summary_large_image" as const,
            title: `${component.name} de ${component.brand}`,
            description,
            images: [component.image],
          },
        }
      : {}),
  };
}

export default async function ComponentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getComponentBySlug(slug);

  if (!result.success) {
    throw new Error(result.error);
  }

  if (!result.data) {
    notFound();
  }

  return <ComponentDetailView component={result.data} />;
}
