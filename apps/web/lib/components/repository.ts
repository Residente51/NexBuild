/**
 * Component repository.
 *
 * The single entry point for component data. Everything else reads
 * components through this module, so replacing data/components.ts with
 * an API or a database stays confined to this file.
 *
 * Synchronous for now. Keep it out of Client Components so it can
 * become async without restructuring its callers.
 */

import { components } from "@/data/components";
import type { PCComponent } from "@/types/component";

import { filterComponents } from "./search";

export function getAllComponents(): PCComponent[] {
  return components;
}

export function getComponentBySlug(slug: string): PCComponent | undefined {
  return components.find((component) => component.slug === slug);
}

export function searchComponents(query: string): PCComponent[] {
  return filterComponents(components, query);
}
