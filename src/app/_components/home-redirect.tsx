"use client";

import { redirect } from "next/navigation";
import { useSelectedProject } from "../_state/project-state";

export default function HomeRedirect() {
  const { selectedProjectId } = useSelectedProject();

  return redirect(`/projectes/${selectedProjectId}/llistes`);
}
