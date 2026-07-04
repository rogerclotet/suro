"use client";

import type { FormEvent, ReactNode } from "react";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";

/**
 * Two-line layout shared by the list and template "add item" forms: the item
 * name input fills the first row, while the category picker, an optional slot
 * for future controls, and the confirm button share the second row. Kept purely
 * presentational so each form keeps its own field wiring and submit logic.
 */
export default function AddItemForm({
  nameInput,
  categoryControl,
  submitButton,
  extraControls,
  onSubmit,
}: {
  nameInput: ReactNode; // InputGroupInput for the item name — row 1
  categoryControl: ReactNode; // CategoryPicker — row 2
  submitButton: ReactNode; // confirm button — row 2
  extraControls?: ReactNode; // reserved for future per-item controls — row 2
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(event);
      }}
      className="w-full"
    >
      <InputGroup>
        {nameInput}
        <InputGroupAddon align="block-end" className="flex-wrap gap-2">
          {categoryControl}
          {extraControls}
          <div className="ml-auto">{submitButton}</div>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
