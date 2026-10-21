import { getCurrentUser } from "@/server/auth/session";
import { env } from "@/server/env";
import { CrispChat } from "./crisp-chat";

/** Chat-ul Crisp (doar dacă CRISP_WEBSITE_ID e setat), cu datele contului pentru utilizatorii logați. */
export async function SupportChat() {
  if (!env.CRISP_WEBSITE_ID) return null;
  const user = await getCurrentUser();
  const role = user ? (user.isProvider && user.isClient ? "ambele" : user.isProvider ? "prestator" : user.isClient ? "client" : "nou") : "";
  return (
    <CrispChat
      websiteId={env.CRISP_WEBSITE_ID}
      user={user ? { email: user.email, name: user.name, role, plan: user.isProvider ? "prestator" : "client" } : null}
    />
  );
}
