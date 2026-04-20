export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  price: number;
  /** Discount amount in same currency as price. Optional — mock entries omit it. */
  discount?: number | null;
  pdfUrl: string;
  pdfPreviewUrl: String;
  pageCount: number;
  category: string;
  rating: number;
  reviewCount: number;
  publishedYear: number;
  tags: string[];
}
export const books: Book[] = [];