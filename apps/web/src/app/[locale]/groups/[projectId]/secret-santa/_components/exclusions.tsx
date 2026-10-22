"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { maxExclusionSize } from "domain/secret-santa";
import { SquaresExcludeIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import type { SecretSanta, SecretSantaPerson } from "@/app/_data/secret-santa";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import ModalAction from "@/components/ui/modal-action";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { captureException } from "@/lib/error-reporting";
import { cn } from "@/lib/utils";
import { secretSantaErrorMessage } from "./errors";
import ParticipantCard from "./participant-card";

/**
 * Groups who must not draw each other. The organizer removes them until the
 * draw, and adds new ones while enough people take part.
 */
export default function Exclusions({
  secretSanta,
  editable,
  canAdd,
}: {
  secretSanta: SecretSanta;
  editable: boolean;
  canAdd: boolean;
}) {
  const t = useTranslations("secretSanta");

  return (
    <>
      <Separator />

      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{t("exclusionsTitle")}</h3>
        <p className="text-muted-foreground text-sm">
          {t("exclusionsDescription")}
        </p>
      </div>

      <ul className="flex flex-wrap gap-2">
        {secretSanta.exclusions.map((exclusion) => (
          <ExclusionGroup
            key={exclusion.join("-")}
            secretSanta={secretSanta}
            exclusion={exclusion}
            editable={editable}
          />
        ))}
      </ul>

      {canAdd && (
        <ModalForm
          trigger={
            <Button variant="outline">
              <SquaresExcludeIcon /> {t("exclusionCreateAction")}
            </Button>
          }
          title={t("exclusionCreateTitle")}
          description={t("exclusionCreateDescription", {
            count: maxExclusionSize(secretSanta.participants.length),
          })}
        >
          <CreateExclusionForm secretSanta={secretSanta} />
        </ModalForm>
      )}
    </>
  );
}

function personById(secretSanta: SecretSanta, id: string) {
  return secretSanta.participants.find((person) => person.id === id);
}

function ExclusionGroup({
  secretSanta,
  exclusion,
  editable,
}: {
  secretSanta: SecretSanta;
  exclusion: string[];
  editable: boolean;
}) {
  const removeExclusion = useMutation(api.secretSantas.removeExclusion);
  const t = useTranslations("secretSanta");
  const tCommon = useTranslations("common");
  const people = exclusion
    .map((id) => personById(secretSanta, id))
    .filter((person): person is SecretSantaPerson => person !== undefined);

  async function handleDelete() {
    try {
      await removeExclusion({
        secretSantaId: secretSanta.id as Id<"secretSantas">,
        userIds: exclusion as Id<"users">[],
      });
      toast.success(t("exclusionDeleteSuccess"));
    } catch (error) {
      captureException(error, { action: "delete_exclusion" });
      toast.error(t("exclusionDeleteError"));
    }
  }

  return (
    <li className="group relative flex flex-row flex-wrap gap-1 rounded-xl border-2 border-destructive/20 bg-destructive/5 p-1">
      {people.map((person) => (
        <ParticipantCard
          key={person.id}
          person={person}
          fallbackName={t("unnamedMember")}
          compact
          className="pointer-events-none h-24 bg-accent/10"
        />
      ))}

      {editable && (
        <ModalAction
          title={t("exclusionDeleteTitle", {
            names: people
              .map((person) => person.name ?? t("unnamedMember"))
              .join(", "),
          })}
          description={t("exclusionDeleteDescription")}
          actionText={tCommon("delete")}
          variant="destructive"
          onAction={handleDelete}
          trigger={
            <Button
              variant="ghostDestructive"
              size="icon"
              aria-label={tCommon("delete")}
              className="absolute top-1.5 right-1.5 size-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
            >
              <Trash2Icon className="size-4" />
            </Button>
          }
        />
      )}
    </li>
  );
}

function CreateExclusionForm({ secretSanta }: { secretSanta: SecretSanta }) {
  const { close } = useModalForm();
  const addExclusion = useMutation(api.secretSantas.addExclusion);
  const t = useTranslations("secretSanta");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const limit = maxExclusionSize(secretSanta.participants.length);

  function toggle(id: string) {
    setError(null);
    if (selected.includes(id)) {
      setSelected(selected.filter((selectedId) => selectedId !== id));
    } else if (selected.length < limit) {
      setSelected([...selected, id]);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (selected.length < 2) {
      setError(t("validationExclusionMinParticipants"));
      return;
    }
    setSubmitting(true);
    try {
      await addExclusion({
        secretSantaId: secretSanta.id as Id<"secretSantas">,
        userIds: selected as Id<"users">[],
      });
      toast.success(t("exclusionCreateSuccess"));
      close();
    } catch (caught) {
      const message = secretSantaErrorMessage(caught, t);
      if (message === null) {
        captureException(caught, { action: "create_exclusion" });
      }
      setError(message ?? t("exclusionCreateError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-1.5">
        {secretSanta.participants.map((person) => {
          const isSelected = selected.includes(person.id);
          return (
            <button
              key={person.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(person.id)}
              className="cursor-pointer rounded-xl"
            >
              <ParticipantCard
                person={person}
                fallbackName={t("unnamedMember")}
                className={cn(
                  "box-content border-2 hover:bg-accent/10",
                  isSelected && "border-primary bg-primary/10",
                )}
              />
            </button>
          );
        })}
      </div>

      {error && <FieldError>{error}</FieldError>}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Spinner /> : <SquaresExcludeIcon />}
        {t("exclude")}
      </Button>
    </form>
  );
}
