"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setPublicAction } from "@/app/profil/actions";
import { Switch } from "@/components/ui/switch";

export function PublicToggle({ initial }: { initial: boolean }) {
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-2 text-sm">
      <Switch
        checked={value}
        disabled={pending}
        onCheckedChange={(v) => {
          setValue(v);
          start(async () => {
            const r = await setPublicAction(v);
            if (r && !r.ok) {
              setValue(!v);
              toast.error(r.error);
            } else if (r?.ok) toast.success(r.message);
          });
        }}
      />
      {value ? "Profil public în căutări" : "Profil ascuns din căutări"}
    </label>
  );
}
