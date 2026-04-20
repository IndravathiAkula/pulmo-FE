"use server";

/**
 * Author book Server Actions — wraps `booksService` create/update/delete.
 *
 * The form validates on the server (single source of truth) and returns
 * the toast-system-compatible `{ success, message, errors? }` shape. On
 * mutation success we revalidate the relevant pages so the my-books
 * list and any cached detail views re-render.
 *
 * Books always enter / re-enter `PENDING` status on create/update per
 * the API spec — the moderation queue lives under Phase 4 (admin).
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { booksService } from "@/server/catalog/books.service";
import { ApiError } from "@/server/api/errors";
import type {
  BookResponse,
  CreateBookRequest,
  UpdateBookRequest,
} from "@/server/api/apiTypes";

type BookFieldErrors = {
  title?: string;
  description?: string;
  price?: string;
  discount?: string;
  pages?: string;
  coverUrl?: string;
  previewUrl?: string;
  bookUrl?: string;
  versionNumber?: string;
  categoryId?: string;
};

export interface BookActionState {
  success: boolean;
  message: string;
  errors?: BookFieldErrors;
  /** Returned by createBookAction so the client can route to /edit. */
  bookId?: string;
}

function parseForm(formData: FormData): {
  raw: CreateBookRequest & { message?: string };
  errors: BookFieldErrors;
} {
  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const priceRaw = formData.get("price")?.toString().trim() ?? "";
  const discountRaw = formData.get("discount")?.toString().trim() ?? "";
  const keywords = formData.get("keywords")?.toString().trim() ?? "";
  const pagesRaw = formData.get("pages")?.toString().trim() ?? "";
  // URLs come from the upload service via FileUpload's hidden input;
  // they may be relative (e.g. "/ebook/files/books/abc.pdf") so we no
  // longer enforce an http(s) prefix — just trim and pass through.
  const coverUrl = formData.get("coverUrl")?.toString().trim() ?? "";
  const previewUrl = formData.get("previewUrl")?.toString().trim() ?? "";
  const bookUrl = formData.get("bookUrl")?.toString().trim() ?? "";
  const versionNumber =
    formData.get("versionNumber")?.toString().trim() ?? "";
  const categoryId = formData.get("categoryId")?.toString().trim() ?? "";
  const message = formData.get("message")?.toString().trim() ?? "";

  const errors: BookFieldErrors = {};

  if (!title) errors.title = "Title is required";
  else if (title.length > 200)
    errors.title = "Title must be under 200 characters";

  if (!priceRaw) errors.price = "Price is required";

  const price = Number(priceRaw);
  if (priceRaw && (Number.isNaN(price) || price < 0)) {
    errors.price = "Price must be a non-negative number";
  }

  let discount: number | undefined;
  if (discountRaw) {
    discount = Number(discountRaw);
    if (Number.isNaN(discount) || discount < 0) {
      errors.discount = "Discount must be a non-negative number";
    } else if (!Number.isNaN(price) && discount > price) {
      errors.discount = "Discount cannot exceed price";
    }
  }

  let pages: number | undefined;
  if (pagesRaw) {
    pages = Number(pagesRaw);
    if (!Number.isInteger(pages) || pages < 1) {
      errors.pages = "Pages must be a positive whole number";
    }
  }

  if (description && description.length > 5000) {
    errors.description = "Description must be under 5000 characters";
  }

  if (!categoryId) errors.categoryId = "Category is required";

  return {
    raw: {
      title,
      description: description || undefined,
      // `price` is guaranteed to be a valid non-negative number here —
      // validation above rejects empty, NaN, and negative inputs before
      // we build `raw`. Keeping the bare value (no NaN-to-0 fallback)
      // ensures any future relaxation of validation can't silently ship
      // a free book via a coercion quirk.
      price,
      discount,
      keywords: keywords || undefined,
      pages,
      coverUrl: coverUrl || undefined,
      previewUrl: previewUrl || undefined,
      bookUrl: bookUrl || undefined,
      versionNumber: versionNumber || undefined,
      categoryId,
      message: message || undefined,
    },
    errors,
  };
}

// ─── Create ─────────────────────────────────────────────────
export async function createBookAction(
  _prev: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  const { raw, errors } = parseForm(formData);

  // Book file is required on create — every new submission must ship
  // a readable PDF/EPUB. On edit the existing file carries over, so
  // bookUrl is optional there.
  if (!raw.bookUrl) {
    errors.bookUrl = "Upload the book's PDF or EPUB file before submitting";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Please fix the errors below", errors };
  }

  try {
    const result = await booksService.create(raw);
    if (!result.ok) {
      return { success: false, message: result.error.message };
    }

    revalidatePath("/dashboard/books");

    return {
      success: true,
      message:
        result.message ?? "Book submitted for review",
      bookId: result.data.id,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof ApiError
          ? error.message
          : "Could not create book — please try again",
    };
  }
}

// ─── Update ─────────────────────────────────────────────────
export async function updateBookAction(
  bookId: string,
  _prev: BookActionState,
  formData: FormData
): Promise<BookActionState> {
  if (!bookId) {
    return { success: false, message: "Missing book id" };
  }

  const { raw, errors } = parseForm(formData);

  if (Object.keys(errors).length > 0) {
    return { success: false, message: "Please fix the errors below", errors };
  }

  const updateBody: UpdateBookRequest = raw;

  try {
    const result = await booksService.update(bookId, updateBody);
    if (!result.ok) {
      return { success: false, message: result.error.message };
    }

    revalidatePath("/dashboard/books");
    revalidatePath(`/dashboard/books/${bookId}/edit`);
    revalidatePath(`/dashboard/books/${bookId}/history`);

    return {
      success: true,
      message:
        result.message ?? "Book updated — re-submitted for review",
      bookId: result.data.id,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof ApiError
          ? error.message
          : "Could not update book — please try again",
    };
  }
}

// ─── Delete ─────────────────────────────────────────────────
/**
 * Server-side delete + redirect. Designed to be called from a
 * <form action={deleteBookAction.bind(null, id)}> in a confirm dialog.
 */
export async function deleteBookAction(bookId: string): Promise<void> {
  if (!bookId) return;

  try {
    await booksService.remove(bookId);
  } catch {
    // Even on failure we redirect back to the list — the next render
    // will show the (still-existing) book so the user knows it didn't
    // delete. Surface a toast on the next page if needed in the future.
  }

  revalidatePath("/dashboard/books");
  redirect("/dashboard/books");
}

/** Convenience helper used by detail/edit pages to fetch one book. */
export async function getOwnBook(
  bookId: string
): Promise<BookResponse | null> {
  try {
    const result = await booksService.getMine(bookId);
    return result.ok ? result.data : null;
  } catch {
    return null;
  }
}
