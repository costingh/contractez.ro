import { permanentRedirect } from "next/navigation";

/** Portofelul de credite a fost înlocuit de abonamente; păstrăm linkurile vechi (emailuri, marcaje). */
export default function WalletPage() {
  permanentRedirect("/abonament");
}
