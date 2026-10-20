"use client";

import { useState } from "react";
import type { CategoryOption } from "@/components/shared/category-select";
import { ProjectForm } from "./project-form";
import type { ProjectFormValues, QualityView } from "./types";

/** Wrapper client pentru editare: deține starea formularului. */
export function ProjectEditor(props: {
  categories: CategoryOption[];
  initial: ProjectFormValues;
  projectId: string;
  status: string;
  quality: QualityView | null;
  emailVerified: boolean;
}) {
  const [values, setValues] = useState(props.initial);
  return (
    <ProjectForm
      categories={props.categories}
      value={values}
      onChange={setValues}
      projectId={props.projectId}
      status={props.status}
      initialQuality={props.quality}
      emailVerified={props.emailVerified}
    />
  );
}
