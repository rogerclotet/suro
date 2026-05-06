import type { ReactNode } from "react";

interface OnboardingStepProps {
  icon: ReactNode;
  title: string;
  body: string;
}

export default function OnboardingStep({
  icon,
  title,
  body,
}: OnboardingStepProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary [&_svg]:h-8 [&_svg]:w-8">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-xl">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
