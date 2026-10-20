import { permanentRedirect } from "next/navigation";

/** Promovările se cumpărau separat; acum sunt incluse în planuri (Pro: oferte evidențiate, Business: profil promovat). */
export default function PromotePage() {
  permanentRedirect("/abonament");
}
