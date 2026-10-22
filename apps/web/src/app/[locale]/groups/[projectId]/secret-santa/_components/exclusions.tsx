"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { maxExclusionSize } from "domain/secret-santa";
import { PlusIcon, SquaresExcludeIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import type { SecretSanta, SecretSantaPerson } from "@/app/_data/secret-santa";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import ModalAction from "@/components/ui/modal-action";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import { Spinner } from "@/components/ui/spinner";
import UserAvatar from "@/components/user-avatar";
import { captureException } from "@/lib/error-reporting";
import { secretSantaErrorMessage } from "./errors";
import { SectionLabel } from "./layout";
import ParticipantTile from "./participant-tile";

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
  const { exclusions } = secretSanta;

  return (
    <section className="space-y-2">
      <SectionLabel
        count={exclusions.length > 0 ? exclusions.length : undefined}
      >
        {t("exclusionsTitle")}
      </SectionLabel>
      <p className="text-muted-foreground text-sm">
        {t("exclusionsDescription")}
      </p>

      {exclusions.length > 0 && (
        <ul className="divide-y divide-border">
          {exclusions.map((exclusion) => (
            <ExclusionRow
              key={exclusion.join("-")}
              secretSanta={secretSanta}
              exclusion={exclusion}
              editable={editable}
            />
          ))}
        </ul>
      )}

      {canAdd && (
        <ModalForm
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-dashed text-muted-foreground"
            >
              <PlusIcon /> {t("exclusionCreateAction")}
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
    </section>
  );
}

function personById(secretSanta: SecretSanta, id: string) {
  return secretSanta.participants.find((person) => person.id === id);
}

function ExclusionRow({
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
  const names = people
    .map((person) => person.name ?? t("unnamedMember"))
    .join(", ");

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
    <li className="flex items-center gap-3 py-2.5">
      <div className="flex -space-x-2">
        {people.map((person) => (
          <UserAvatar
            key={person.id}
            user={person}
            className="size-7 text-xs ring-2 ring-background"
          />
        ))}
      </div>
      <span className="min-w-0 flex-1 break-words">{names}</span>
      {editable && (
        <ModalAction
          title={t("exclusionDeleteTitle", { names })}
          description={t("exclusionDeleteDescription")}
          actionText={tCommon("delete")}
          variant="destructive"
          onAction={handleDelete}
          trigger={
            <Button
              variant="ghostDestructive"
              size="icon-sm"
              aria-label={`${tCommon("delete")}: ${names}`}
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
      <p className="font-semibold text-primary text-sm">
        {t("exclusionSelected", { count: selected.length, max: limit })}
      </p>
      <div className="flex flex-wrap gap-y-2">
        {secretSanta.participants.map((person) => {
          const isSelected = selected.includes(person.id);
          const full = !isSelected && selected.length >= limit;
          return (
            <button
              key={person.id}
              type="button"
              aria-pressed={isSelected}
              disabled={full}
              onClick={() => toggle(person.id)}
              className="cursor-pointer rounded-xl transition-opacity hover:bg-accent disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ParticipantTile
                person={person}
                fallbackName={t("unnamedMember")}
                selected={isSelected}
                className="py-1.5"
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
