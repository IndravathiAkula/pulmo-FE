import { books as mockBooks } from '@/app/data/books';
import { booksService } from '@/server/catalog/books.service';
import { categoriesService } from '@/server/catalog/categories.service';
import { adaptBookResponseToBook } from '@/lib/book-adapter';
import { DepartmentClient } from '@/features/books/components/DepartmentClient';
import type { Book } from '@/app/data/books';

/**
 * Fetch the catalog: try the real API first, fall back to the mock
 * dataset if the call fails or the DB is empty so the page still
 * renders something while seeding is in progress.
 *
 * Returns categories as the list of distinct category NAMES (matches
 * the legacy DepartmentClient contract — we filter against names).
 */
async function loadCatalog(): Promise<{
  books: Book[];
  categories: string[];
}> {
  const [booksResult, categoriesResult] = await Promise.all([
    booksService.listPublic().catch(() => null),
    categoriesService.list().catch(() => null),
  ]);

  const apiBooks = booksResult?.ok ? booksResult.data : [];
  const apiCategories = categoriesResult?.ok ? categoriesResult.data : [];

  // Prefer real data when available — even if categories are empty,
  // we can still derive them from the books list.
  if (apiBooks.length > 0) {
    const adapted = apiBooks.map(adaptBookResponseToBook);
    const categoryNames = apiCategories.length > 0
      ? apiCategories.map((c) => c.name)
      : Array.from(new Set(adapted.map((b) => b.category)));
    return { books: adapted, categories: categoryNames };
  }

  // Fallback — mock dataset
  return {
    books: mockBooks,
    categories: Array.from(new Set(mockBooks.map((b) => b.category))),
  };
}

export default async function DepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const { books, categories } = await loadCatalog();

  // Resolve the URL slug back to its category name. `all-departments`
  // intentionally matches nothing → null → DepartmentClient shows all.
  const categoryName =
    categories.find(
      (cat) => cat.toLowerCase().replace(/\s+/g, '-') === resolvedParams.id
    ) || null;

  return (
    <main className="max-w-[1800px] mx-auto py-8">
      <DepartmentClient
        initialCategory={categoryName}
        categories={categories}
        books={books}
      />
    </main>
  );
}
