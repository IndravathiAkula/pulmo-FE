"use server";

/**
 * Admin book moderation actions — wraps `booksService` approve/reject.
 *
 * Both actions revalidate the moderation list (so the book either
 * leaves the Pending tab or shows its new status), the detail page,
 * the public book listing (so newly approved books appear), and the
 * author's own-books list (so the author sees the new status).
 */

import { revalidatePath } from "next/cache";
import { booksService } from "@/server/catalog/books.service";
import { ApiError } from "@/server/api/errors";

export interface AdminBookActionState {
  success: boolean;
  message: string;
}

function revalidateAfterModeration(bookId: string) {
  revalidatePath("/dashboard/admin/books");
  revalidatePath(`/dashboard/admin/books/${bookId}`);
  revalidatePath("/dashboard/books");
  revalidatePath(`/books/${bookId}`);
}

export async function approveBookAction(
  bookId: string
): Promise<AdminBookActionState> {
  if (!bookId) return { success: false, message: "Missing book id" };

  try {
    const result = await booksService.approve(bookId);
    if (!result.ok) {
      return { success: false, message: result.error.message };
    }

    revalidateAfterModeration(bookId);
    return {
      success: true,
      message: result.message ?? "Book approved and published",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof ApiError
          ? error.message
          : "Could not approve — please try again",
    };
  }
}

export async function rejectBookAction(
  bookId: string,
  reason: string
): Promise<AdminBookActionState> {
  if (!bookId) return { success: false, message: "Missing book id" };

  const trimmedReason = reason.trim();
  // Backend marks reason optional, but UX-wise authors deserve a
  // reason — guard here so the admin doesn't ship an empty rejection.
  if (!trimmedReason) {
    return {
      success: false,
      message: "Please provide a reason so the author knows what to fix",
    };
  }

  try {
    const result = await booksService.reject(bookId, { reason: trimmedReason });
    if (!result.ok) {
      return { success: false, message: result.error.message };
    }

    revalidateAfterModeration(bookId);
    return {
      success: true,
      message: result.message ?? "Book rejected — author has been notified",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof ApiError
          ? error.message
          : "Could not reject — please try again",
    };
  }
}
