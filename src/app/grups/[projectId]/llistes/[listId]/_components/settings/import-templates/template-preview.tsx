"use client";

import type { Template } from "@/app/_data/list";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import React from "react";

export default function TemplatePreview({
  template,
  onChange,
}: {
  template: Template;
  onChange: (selected: boolean) => void;
}) {
  const [checked, setChecked] = React.useState(false);

  return (
    <label className="cursor-pointer">
      <Card
        className={cn(
          "flex flex-row items-center gap-4 border-2 border-transparent px-4 py-1",
          checked && "border-primary",
        )}
      >
        <Checkbox
          defaultChecked={false}
          onCheckedChange={(checked) => {
            if (checked === "indeterminate") {
              return;
            }
            setChecked(checked);
            onChange(checked);
          }}
        />

        <div className="flex flex-col">
          <div className="font-semibold text-foreground">{template.name}</div>
          <div className="text-muted-foreground">
            {template.items.length} elements
          </div>
        </div>
      </Card>
    </label>
  );
}
