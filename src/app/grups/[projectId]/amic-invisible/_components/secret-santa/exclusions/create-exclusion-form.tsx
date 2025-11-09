import { valibotResolver } from "@hookform/resolvers/valibot";
import { SquaresExcludeIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { exclusionSchema, type SecretSanta } from "@/app/_data/secret-santa";
import { Field, FieldContent, FieldError } from "@/components/ui/field";
import SubmitButton from "@/components/ui/submit-button";
import { createExclusion } from "@/server/secret-santa";
import Participant from "../participant";

export default function CreateExclusionForm({
  secretSanta,
  onClose,
}: {
  secretSanta: SecretSanta;
  onClose: () => void;
}) {
  const { participants } = secretSanta;
  const { data: session } = useSession();
  const form = useForm({
    defaultValues: {
      exclusions: [],
    },
    resolver: valibotResolver(exclusionSchema),
    mode: "onSubmit",
  });

  async function onSubmit(data: v.InferOutput<typeof exclusionSchema>) {
    if (data.exclusions.length > participants.length / 2) {
      form.setError("exclusions", {
        message:
          "Les exclusions no poden ser més de la meitat dels participants",
      });
      return;
    }

    try {
      const result = await createExclusion(secretSanta, data);
      if (result?.error) {
        toast.error(`No s'ha pogut crear l'exclusió: ${result.error}`);
      } else {
        toast.success("Exclusió creada");
      }

      onClose();
      form.reset();
    } catch (error) {
      posthog.captureException(error, {
        distinctId: session?.user.id,
        action: "create_exclusion",
        projectId: secretSanta.projectId,
      });
      toast.error("No s'ha pogut crear l'exclusió, torna-ho a provar més tard");
    }
  }

  function getValuesAfterParticipantChange(participantId: string) {
    const currentExclusions = form.getValues("exclusions");
    if (currentExclusions.includes(participantId)) {
      return currentExclusions.filter((id) => id !== participantId);
    }

    if (currentExclusions.length >= participants.length / 2) {
      return currentExclusions;
    }

    return [...currentExclusions, participantId];
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="exclusions"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldContent>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-1.5">
                {participants.map((participant) => (
                  <button
                    key={participant.id}
                    type="button"
                    onClick={() =>
                      field.onChange(
                        getValuesAfterParticipantChange(participant.id),
                      )
                    }
                    className="cursor-pointer *:box-content *:border-2 hover:*:bg-accent/10 data-[selected=true]:*:border-2 data-[selected=true]:*:border-primary data-[selected=true]:*:bg-primary/10"
                    data-selected={field.value.includes(participant.id)}
                  >
                    <Participant user={participant.user} />
                  </button>
                ))}
              </div>

              <FieldError errors={[fieldState.error]} />
            </FieldContent>
          </Field>
        )}
      />

      <SubmitButton
        icon={<SquaresExcludeIcon />}
        text="Excloure"
        formState={form.formState}
      />
    </form>
  );
}
