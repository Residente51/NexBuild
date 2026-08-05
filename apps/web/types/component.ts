/**
 * PC Component model.
 */

import type { ComponentCategory } from "@/lib/categories";

export interface PCComponent {
  id: number;
  /**
   * Permanent URL identifier, prefixed with the brand.
   * Never regenerate it from `name` — display names may change,
   * slugs must not.
   */
  slug: string;
  name: string;
  brand: string;
  category: ComponentCategory;
  price: number;
  image?: string;
}