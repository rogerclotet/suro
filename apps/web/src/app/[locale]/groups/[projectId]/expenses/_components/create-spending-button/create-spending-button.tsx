"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { PlusIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Pot } from "@/app/_data/pot";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SubmitButton from "@/components/ui/submit-button";
import { createSpendingOffline } from "@/lib/offline/offline-spendings";
import { spendingSchema } from "./data";

type Member = {
  user: { id: string; name: string | null; image: string | null };
};

export default function CreateSpendingButton({
  members,
  pot,
}: {
  members: Member[];
  pot: Pot;
}) {
  const { data: session } = useSession();
  const t = useTranslations("expenses");
  const form = useForm<v.InferInput<typeof spendingSchema>>({
    defaultValues: {
      amount: 0,
      from: session?.user.id,
      to: undefined,
      description: "",
    },
    resolver: valibotResolver(spendingSchema),
  });

  return (
    <ModalForm
      trigger={<Action icon={PlusIcon} label={t("createSpendingTitle")} />}
      title={t("createSpendingTitle")}
      description={t("createSpendingDescription")}
    >
      <CreateSpendingFormContent
        form={form}
        members={members}
        pot={pot}
        sessionId={session?.user.id}
      />
    </ModalForm>
  );
}

function CreateSpendingFormContent({
  form,
  members,
  pot,
  sessionId,
}: {
  form: ReturnType<typeof useForm<v.InferInput<typeof spendingSchema>>>;
  members: Member[];
  pot: Pot;
  sessionId?: string;
}) {
  const { close } = useModalForm();
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");

  async function onSubmit(data: v.InferInput<typeof spendingSchema>) {
    try {
      await createSpendingOffline(pot, {
        amount: Number(data.amount),
        description: data.description,
        from: data.from,
        to: data.to,
      });
      form.reset();
      toast.success(t("createSpendingSuccess"));
      close();
    } catch (e) {
      posthog.captureException(e, {
        distinctId: sessionId,
        action: "create_spending",
        potId: pot.id,
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

        <FormField
          control={form.control}
          name="from"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("payer")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={form.formState.isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectUser")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {members.map((u) => (
                    <SelectItem key={u.user.id} value={u.user.id}>
                      {u.user.name}
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
          name="to"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("recipient")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={form.formState.isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("split")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {members.map((u) => (
                    <SelectItem key={u.user.id} value={u.user.id}>
                      {u.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
