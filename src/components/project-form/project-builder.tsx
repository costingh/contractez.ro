"use client";

import {
  CheckCircle2,
  ClipboardPaste,
  FileText,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { DRAFT_COOKIE } from "@/components/home/draft";
import { draftFromTextAction } from "@/app/proiecte/nou/actions";
import type { CategoryOption } from "@/components/shared/category-select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ProjectForm } from "./project-form";
import { QualityPanel } from "./quality-panel";
import {
  emptyProjectValues,
  type ProjectFormValues,
  type QualityView,
} from "./types";

const EXAMPLE =
  "Salut! Caut pe cineva care să-mi facă un site pentru restaurantul nostru din Cluj, cu meniu, galerie și rezervări online. Buget 2000-3000 lei, ar fi bine cu factură. Avem logo și poze.";

export function ProjectBuilder({
  categories,
  emailVerified,
  aiEnabled,
  initialText = "",
}: {
  categories: CategoryOption[];
  emailVerified: boolean;
  aiEnabled: boolean;
  initialText?: string;
}) {
  const [tab, setTab] = useState<"import" | "form">("import");
  const [values, setValues] = useState<ProjectFormValues>(emptyProjectValues);
  const [text, setText] = useState(initialText);
  const [draftQuality, setDraftQuality] = useState<QualityView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);
  const [pending, start] = useTransition();

  // Cererea din hero a fost preluată (prin URL sau cookie): ștergem cookie-ul ca să nu reapară.
  useEffect(() => {
    if (initialText) document.cookie = `${DRAFT_COOKIE}=; max-age=0; path=/`;
  }, [initialText]);

  const generate = () => {
    setError(null);
    start(async () => {
      const res = await draftFromTextAction(text);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setValues({ ...emptyProjectValues, ...res.values });
      setDraftQuality(res.quality);
      setImported(true);
      setTab("form");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <Tabs
      value={tab}
      onValueChange={(t) => setTab(t as "import" | "form")}
      className="gap-5"
    >
      <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
        <TabsTrigger value="import">
          <Wand2 /> Descrie liber / importă
        </TabsTrigger>
        <TabsTrigger value="form">
          <FileText /> Completează formularul
        </TabsTrigger>
      </TabsList>

      <TabsContent value="import" className="space-y-4">
        <div className="ring-glow space-y-5 rounded-2xl border bg-card p-5 shadow-md sm:p-7">
          <div className="flex gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(140deg,#1c2f57,#2b4acb_70%,#4f7cff)] text-white shadow-[0_8px_20px_-8px_rgb(43_74_203/0.7)]">
              <Sparkles className="size-[1.125rem]" />
            </span>
            <div className="min-w-0 space-y-1">
              <h2 className="text-lg font-semibold tracking-[-0.015em]">
                Scrie ca și cum i-ai explica{" "}
                <span className="serif-em text-gradient">unui prieten</span>
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Sau lipește o postare pe care ai scris-o deja într-un grup de
                Facebook. {aiEnabled ? "AI-ul" : "Asistentul"} o transformă
                într-un proiect structurat (categorie, buget, localitate,
                competențe) și îți spune ce mai lipsește. Tu verifici totul
                înainte de publicare.
              </p>
            </div>
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="min-h-44 rounded-xl bg-surface px-4 py-3 text-[0.9375rem] leading-relaxed dark:bg-muted/40"
            maxLength={6000}
            placeholder={EXAMPLE}
            aria-label="Descrierea proiectului"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              size="lg"
              onClick={generate}
              disabled={pending || text.trim().length < 20}
            >
              {pending ? <Loader2 className="animate-spin" /> : <Wand2 />}
              {pending ? "Structurez cererea…" : "Generează proiectul"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setText(EXAMPLE)}
              disabled={pending}
            >
              <ClipboardPaste /> Folosește un exemplu
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground sm:ml-auto"
              onClick={() => setTab("form")}
            >
              Prefer să completez direct →
            </button>
          </div>
          {!aiEnabled && (
            <p className="text-xs text-muted-foreground">
              AI-ul nu este activ acum; folosim reguli automate pentru a
              precompleta formularul.
            </p>
          )}
          <ol className="grid gap-2 border-t pt-5 text-xs text-muted-foreground sm:grid-cols-3">
            {[
              "Descrii liber, cu cuvintele tale",
              `${aiEnabled ? "AI-ul" : "Asistentul"} structurează cererea`,
              "Verifici și publici",
            ].map((step, n) => (
              <li key={step} className="flex items-center gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[0.6875rem] font-semibold text-primary-foreground tabular-nums">
                  {n + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </TabsContent>

      <TabsContent value="form" className="space-y-4">
        {imported && draftQuality && (
          <div className="space-y-3">
            <div className="enter flex gap-3 rounded-2xl border border-success/25 bg-success/6 p-4 text-sm">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              <div>
                <div className="font-medium">
                  Am precompletat proiectul din textul tău.
                </div>
                <p className="text-muted-foreground">
                  Verifică fiecare câmp — mai ales categoria, bugetul și
                  localitatea — apoi publică.
                </p>
              </div>
            </div>
            {(draftQuality.missing.length > 0 ||
              draftQuality.questions.length > 0 ||
              draftQuality.budgetInsight) && (
              <QualityPanel quality={draftQuality} />
            )}
          </div>
        )}
        <ProjectForm
          categories={categories}
          value={values}
          onChange={setValues}
          emailVerified={emailVerified}
        />
      </TabsContent>
    </Tabs>
  );
}
