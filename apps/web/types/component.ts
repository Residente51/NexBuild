/**
 * PC Component model.
 */

import type { ComponentCategory } from "@/lib/categories";

export interface PCComponent {
  id: number;
  name: string;
  brand: string;
  category: ComponentCategory;
  price: number;
  image?: string;
}