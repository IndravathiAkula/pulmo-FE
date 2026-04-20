"use server";

import { redirect } from "next/navigation";
import { authService } from "@/server/auth/auth.service";

export async function logoutAction(): Promise<void> {
  await authService.logout();
  redirect("/login");
}

export async function logoutAllAction(): Promise<void> {
  await authService.logoutAll();
  redirect("/login");
}
