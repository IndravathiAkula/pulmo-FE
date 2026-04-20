import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { categoriesService } from "@/server/catalog/categories.service";
import { BookForm } from "@/features/books/components/BookForm";

export default async function NewBookPage() {
  const result = await categoriesService.list();
  const categories = result.ok ? result.data : [];

  return (
    <div className="max-w-4xl">
      <Link
        href="/dashboard/books"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-primary)] mb-4 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back to my books
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight">
          Add a new book
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Submit your book for admin review. It'll appear in the public
          catalog once approved.
        </p>
      </header>

      <BookForm mode="create" categories={categories} />
    </div>
  );
}
