"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import Action from "@/components/action";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import SubmitButton from "@/components/ui/submit-button";
import { useSession } from "@/lib/session";
import { soloSpendingSchema } from "./data";

export default function CreateSoloSpendingButton({
  potId,
  memberId,
}: {
  potId: string;
  memberId: string;
}) {
  const t = useTranslations("expenses");
  const form = useForm<v.InferInput<typeof soloSpendingSchema>>({
    defaultValues: {
      amount: 0,
      description: "",
    },
    resolver: valibotResolver(soloSpendingSchema),
  });

  return (
    <ModalForm
      trigger={<Action icon={PlusIcon} label={t("createSpendingTitle")} />}
      title={t("createSpendingTitle")}
      description={t("soloCreateSpendingDescription")}
    >
      <CreateSoloSpendingFormContent
        form={form}
        potId={potId}
        memberId={memberId}
      />
    </ModalForm>
  );
}

function CreateSoloSpendingFormContent({
  form,
  potId,
  memberId,
}: {
  form: ReturnType<typeof useForm<v.InferInput<typeof soloSpendingSchema>>>;
  potId: string;
  memberId: string;
}) {
  const { close } = useModalForm();
  const { data: session } = useSession();
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const createSpending = useMutation(api.expenses.createSpending);

  async function onSubmit(data: v.InferInput<typeof soloSpendingSchema>) {
    try {
      await createSpending({
        potId: potId as Id<"pots">,
        amount: Math.round(Number(data.amount) * 100),
        description: data.description || undefined,
        from: memberId as Id<"users">,
      });
      form.reset();
      toast.success(t("createSpendingSuccess"));
      close();
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "create_solo_spending",
        potId,
      });
      toast.error(t("createSpendingError"));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("amount")}</FormLabel>
              <div className="flex flex-row items-center gap-4">
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    disabled={form.formState.isSubmitting}
                  />
                </FormControl>
                <span>€</span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tCommon("description")}</FormLabel>
              <FormControl>
                <Input {...field} disabled={form.formState.isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton
          icon={<PlusIcon />}
          text={tCommon("create")}
          formState={form.formState}
        />
      </form>
    </Form>
  );
}
