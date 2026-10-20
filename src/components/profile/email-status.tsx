import { BadgeCheck, MailWarning } from "lucide-react";
import { ResendButton } from "@/app/(auth)/verifica-email/resend-button";

export function EmailStatus({ email, verified }: { email: string; verified: boolean }) {
  if (verified) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-success/25 bg-success/6 p-3.5 text-sm">
        <BadgeCheck className="size-4 text-success" /> Email confirmat: <span className="font-medium">{email}</span>
      </div>
    );
  }
  return (
    <div className="space-y-3 rounded-lg border border-warning/30 bg-warning/8 p-3 text-sm">
      <div className="flex items-start gap-2">
        <MailWarning className="mt-0.5 size-4 shrink-0" />
        <span>
          Emailul <span className="font-medium">{email}</span> nu este confirmat încă. Deschide linkul primit pe email (verifică și Spam).
        </span>
      </div>
      <ResendButton />
    </div>
  );
}
