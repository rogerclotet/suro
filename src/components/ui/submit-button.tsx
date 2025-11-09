import type { FieldValues, FormState } from "react-hook-form";
import { Button } from "./button";
import { Spinner } from "./spinner";

export default function SubmitButton<T>({
  icon,
  text,
  formState,
  ...props
}: {
  icon: React.ReactNode;
  text: string;
  formState: FormState<T extends FieldValues ? T : never>;
} & React.ComponentProps<"button">) {
  return (
    <Button
      {...props}
      type="submit"
      disabled={!formState.isDirty || formState.isSubmitting}
      className="w-full space-x-2"
    >
      {formState.isSubmitting ? <Spinner /> : icon}
      {text}
    </Button>
  );
}
