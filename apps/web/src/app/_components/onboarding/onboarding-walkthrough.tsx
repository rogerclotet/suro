"use client";

import { useIsClient, useMediaQuery } from "@uidotdev/usehooks";
import {
  Calendar,
  FileTextIcon,
  FolderOpen,
  HandCoins,
  ListTodo,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { CatppuccinColor } from "@/lib/catppuccin-colors";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "./actions";
import OnboardingProfileStep from "./onboarding-profile-step";
import OnboardingStep from "./onboarding-step";

interface OnboardingUser {
  name?: string | null;
  image?: string | null;
  customImage?: string | null;
  avatarColor?: string | null;
}

interface OnboardingWalkthroughProps {
  user: OnboardingUser;
  onComplete: () => void;
}

const TOTAL_STEPS = 7;

export default function OnboardingWalkthrough(
  props: OnboardingWalkthroughProps,
) {
  const isClient = useIsClient();
  if (!isClient) return null;
  return <ClientOnboardingWalkthrough {...props} />;
}

function ClientOnboardingWalkthrough({
  user,
  onComplete,
}: OnboardingWalkthroughProps) {
  const t = useTranslations("onboarding");
  const isMdOrLarger = useMediaQuery("(min-width: 768px)");
  const [currentStep, setCurrentStep] = useState(0);
  const [profileName, setProfileName] = useState(user.name ?? "");
  const [profileColor, setProfileColor] = useState<CatppuccinColor | null>(
    (user.avatarColor as CatppuccinColor) ?? null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    posthog.capture("onboarding_started");
  }, []);

  useEffect(() => {
    posthog.capture("onboarding_step_viewed", {
      step: currentStep,
      stepName: STEP_NAMES[currentStep],
    });
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleFinish = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await completeOnboarding(
        profileName || profileColor
          ? {
              name: profileName || undefined,
              avatarColor: profileColor,
            }
          : undefined,
      );
      onComplete();
    } catch {
      setIsSubmitting(false);
    }
  }, [profileName, profileColor, onComplete]);

  const handleSkip = useCallback(async () => {
    posthog.capture("onboarding_skipped", { atStep: currentStep });
    setIsSubmitting(true);
    try {
      await completeOnboarding();
      onComplete();
    } catch {
      setIsSubmitting(false);
    }
  }, [currentStep, onComplete]);

  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const isFirstStep = currentStep === 0;

  const stepContent = useMemo(() => {
    switch (currentStep) {
      case 0:
        return (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <Image src="/logo.png" alt="Suro" width={64} height={64} />
            <div className="space-y-2">
              <h3 className="font-semibold text-xl">{t("welcomeTitle")}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("welcomeBody")}
              </p>
            </div>
          </div>
        );
      case 1:
        return (
          <OnboardingStep
            icon={<ListTodo />}
            title={t("listsTitle")}
            body={t("listsBody")}
          />
        );
      case 2:
        return (
          <OnboardingStep
            icon={<Calendar />}
            title={t("calendarTitle")}
            body={t("calendarBody")}
          />
        );
      case 3:
        return (
          <OnboardingStep
            icon={<FolderOpen />}
            title={t("filesTitle")}
            body={t("filesBody")}
          />
        );
      case 4:
        return (
          <OnboardingStep
            icon={<FileTextIcon />}
            title={t("notesTitle")}
            body={t("notesBody")}
          />
        );
      case 5:
        return (
          <OnboardingStep
            icon={<HandCoins />}
            title={t("expensesTitle")}
            body={t("expensesBody")}
          />
        );
      case 6:
        return (
          <OnboardingProfileStep
            user={user}
            name={profileName}
            onNameChange={setProfileName}
            avatarColor={profileColor}
            onAvatarColorChange={setProfileColor}
          />
        );
      default:
        return null;
    }
  }, [currentStep, t, user, profileName, profileColor]);

  const footer = (
    <div className="flex w-full flex-col gap-3">
      <div className="flex justify-center gap-1.5">
        {STEP_NAMES.map((name, i) => (
          <div
            key={name}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === currentStep
                ? "w-6 bg-primary"
                : "w-1.5 bg-muted-foreground/30",
            )}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isSubmitting || isFirstStep}
          className={cn("flex-1", isFirstStep && "invisible")}
        >
          {t("back")}
        </Button>
        {isLastStep ? (
          <Button
            onClick={handleFinish}
            disabled={isSubmitting}
            className="flex-1"
          >
            <Sparkles className="h-4 w-4" />
            {t("letsGo")}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex-1"
          >
            {t("next")}
          </Button>
        )}
      </div>
      {!isLastStep && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          disabled={isSubmitting}
          className="text-muted-foreground"
        >
          {t("skip")}
        </Button>
      )}
    </div>
  );

  if (isMdOrLarger) {
    return (
      <Dialog open onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md [&>button:last-child]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Onboarding</DialogTitle>
            <DialogDescription>Welcome tutorial</DialogDescription>
          </DialogHeader>
          {stepContent}
          <DialogFooter className="sm:flex-col">{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open onOpenChange={() => {}} dismissible={false}>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>Onboarding</DrawerTitle>
          <DrawerDescription>Welcome tutorial</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-2">{stepContent}</div>
        <DrawerFooter>{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

const STEP_NAMES = [
  "welcome",
  "lists",
  "calendar",
  "files",
  "notes",
  "expenses",
  "profile",
] as const;
