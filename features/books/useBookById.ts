// useBookById – small hook to avoid duplicating book lookup logic across pages.

import { books, Book } from '@/app/data/books';

export function useBookById(id: string | undefined): Book | undefined {
    return books.find((b) => b.id === id);
}
