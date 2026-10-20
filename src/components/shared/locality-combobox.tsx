"use client";

import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type LocalityValue = { id: number; name: string; county: string; countyCode: string } | null;

/**
 * Autocomplete pentru localități (13.000+). Trimite `name` ca input hidden cu id-ul localității.
 * Poate fi controlat (value/onChange) sau necontrolat (defaultValue).
 */
export function LocalityCombobox({
  name = "localityId",
  defaultValue = null,
  value: controlled,
  onChange,
  placeholder = "Alege localitatea",
  className,
  id,
}: {
  name?: string;
  defaultValue?: LocalityValue;
  value?: LocalityValue;
  onChange?: (v: LocalityValue) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<LocalityValue>(defaultValue);
  const value = controlled !== undefined ? controlled : internal;
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<NonNullable<LocalityValue>[]>([]);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/localities?q=${encodeURIComponent(query)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then(setOptions)
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, open]);

  const select = (v: LocalityValue) => {
    setInternal(v);
    onChange?.(v);
    setOpen(false);
  };

  return (
    <>
      <input type="hidden" name={name} value={value?.id ?? ""} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} className={cn("h-9 w-full justify-between border-input px-3 font-normal", className)}>
            <span className={cn("flex items-center gap-2 truncate", !value && "text-muted-foreground")}>
              <MapPin className="size-4 text-muted-foreground" />
              {value ? `${value.name}, ${value.countyCode}` : placeholder}
            </span>
            <ChevronsUpDown className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-72 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Caută oraș, comună sau sat…" value={query} onValueChange={setQuery} />
            <CommandList>
              <CommandEmpty>Nicio localitate găsită.</CommandEmpty>
              <CommandGroup>
                {value && (
                  <CommandItem value="__clear" onSelect={() => select(null)} className="text-muted-foreground">
                    Șterge selecția
                  </CommandItem>
                )}
                {options.map((o) => (
                  <CommandItem key={o.id} value={String(o.id)} onSelect={() => select(o)}>
                    <Check className={cn("mr-1", value?.id === o.id ? "opacity-100" : "opacity-0")} />
                    <span>{o.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{o.county}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
