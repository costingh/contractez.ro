import { Mail, Phone } from "lucide-react";
import { formatPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

export type ContactDetailsData = { phone: string | null; email: string };

/**
 * Datele de contact ale celeilalte părți. Se afișează DOAR într-o colaborare acceptată
 * (datele vin din `counterpartContacts`, care aplică regula pe server).
 */
export function ContactDetails({ contact, label, className }: { contact: ContactDetailsData; label: string; className?: string }) {
  return (
    <div className={cn("space-y-2 rounded-xl border bg-surface px-4 py-3.5 text-sm dark:bg-muted/30", className)}>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {contact.phone ? (
          <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 font-medium tabular-nums underline-offset-4 hover:underline">
            <Phone className="size-3.5 text-muted-foreground" /> {formatPhone(contact.phone)}
          </a>
        ) : (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="size-3.5" /> Fără număr de telefon
          </span>
        )}
        <a href={`mailto:${contact.email}`} className="flex min-w-0 items-center gap-1.5 font-medium underline-offset-4 [overflow-wrap:anywhere] hover:underline">
          <Mail className="size-3.5 shrink-0 text-muted-foreground" /> {contact.email}
        </a>
      </div>
    </div>
  );
}
