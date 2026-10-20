import "server-only";
import { forbidden, redirect } from "next/navigation";
import type { User } from "../db/schema";
import { getCurrentUser } from "./session";

export async function requireUser(next?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/autentificare${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return user;
}

/** Utilizator autentificat care a terminat onboarding-ul. */
export async function requireOnboardedUser(next?: string): Promise<User> {
  const user = await requireUser(next);
  if (!user.onboardedAt) redirect("/onboarding");
  return user;
}

export async function requireProvider(): Promise<User> {
  const user = await requireOnboardedUser();
  if (!user.isProvider) redirect("/onboarding?rol=prestator");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") forbidden();
  return user;
}

export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}
