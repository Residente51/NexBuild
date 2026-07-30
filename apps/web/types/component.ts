/**
 * PC Component model.
 */

export interface PCComponent {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  image?: string;
}