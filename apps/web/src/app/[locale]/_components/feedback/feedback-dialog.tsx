"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { useIsClient, useMediaQuery } from "@uidotdev/usehooks";
import { SendIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useFeedback } from "@/app/_state/feedback-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SubmitButton from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { CURRENT_VERSION } from "@/data/changelog.generated";
import {
  FEEDBACK_QUESTION_MESSAGE_ID,
  FEEDBACK_QUESTION_SECTION_ID,
  FEEDBACK_QUESTION_TYPE_ID,
  FEEDBACK_SECTION_LABELS,
  FEEDBACK_SURVEY_ID,
  FEEDBACK_TYPE_LABELS,
} from "@/lib/feedback-survey";
import { useSession } from "@/lib/session";
import { type FeedbackInput, feedbackSchema } from "./feedback-schema";

// Rendered once in the authenticated chrome (sidebar-inset-content) and driven by the
// shared feedback store, so both the desktop sidebar item and the mobile "More" drawer
// can open it without nesting a Drawer inside another Drawer.
export default function FeedbackDialog() {
  const isClient = useIsClient();

  // The dialog has no SSR-visible trigger of its own, so gating on client readiness
  // (needed for useMediaQuery) is safe and avoids hydration mismatches.
  if (!isClient) {
    return null;
  }

  return <ClientFeedbackDialog />;
}

const SECTION_OPTIONS = Object.keys(
  FEEDBACK_SECTION_LABELS,
) as (keyof typeof FEEDBACK_SECTION_LABELS)[];

function ClientFeedbackDialog() {
  const t = useTranslations("feedback");
  const tNav = useTranslations("nav");
  const { open, setOpen, closeFeedback } = useFeedback();
  const isMdOrLarger = useMediaQuery("(min-width: 768px)");
  const { data: session } = useSession();

  const form = useForm({
    defaultValues: {
      type: "suggestion" as const,
      section: "other" as const,
      message: "",
    },
    resolver: valibotResolver(feedbackSchema),
  });

  async function onSubmit(data: FeedbackInput) {
    try {
      posthog.capture("survey sent", {
        $survey_id: FEEDBACK_SURVEY_ID,
        $survey_questions: [
          FEEDBACK_QUESTION_TYPE_ID,
          FEEDBACK_QUESTION_SECTION_ID,
          FEEDBACK_QUESTION_MESSAGE_ID,
        ],
        [`$survey_response_${FEEDBACK_QUESTION_TYPE_ID}`]:
          FEEDBACK_TYPE_LABELS[data.type],
        [`$survey_response_${FEEDBACK_QUESTION_SECTION_ID}`]:
          FEEDBACK_SECTION_LABELS[data.section],
        [`$survey_response_${FEEDBACK_QUESTION_MESSAGE_ID}`]: data.message,
        feedback_path: window.location.pathname,
        feedback_app_version: CURRENT_VERSION,
      });
      toast.success(t("success"));
      form.reset();
      closeFeedback();
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "submit_feedback",
      });
      toast.error(t("error"));
    }
  }

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("typeLabel")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bug">{t("typeBug")}</SelectItem>
                  <SelectItem value="suggestion">
                    {t("typeSuggestion")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="section"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("sectionLabel")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SECTION_OPTIONS.map((section) => (
                    <SelectItem key={section} value={section}>
                      {section === "other" ? t("sectionOther") : tNav(section)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("messageLabel")}</FormLabel>
              <FormControl>
                <Textarea
                  autoFocus
                  rows={5}
                  placeholder={t("messagePlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton
          icon={<SendIcon />}
          text={t("submit")}
          formState={form.formState}
        />
      </form>
    </Form>
  );

  if (isMdOrLarger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t("title")}</DrawerTitle>
          <DrawerDescription>{t("description")}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6">{formContent}</div>
      </DrawerContent>
    </Drawer>
  );
}
