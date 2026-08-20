/**
 * Component search.
 *
 * Pure query logic, deliberately free of any data source import so the
 * same matching rules can run on the server against the repository or
 * on the client against a list received as props.
 */

import { CATEGORY_LABELS } from "@/lib/categories";
import type { PCComponent } from "@/types/component";

export function filterComponents(
  components: PCComponent[],
  query: string
): PCComponent[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return components;
  }

  return components.filter((component) =>
    [component.name, component.brand, CATEGORY_LABELS[component.category]]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}
