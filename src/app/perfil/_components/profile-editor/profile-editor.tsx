"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Info } from "lucide-react";
import type { User } from "next-auth";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { editProfile } from "./actions";
import { profileSchema } from "./data";

export default function ProfileEditor({ user }: { user: User }) {
  const form = useForm<v.InferInput<typeof profileSchema>>({
    defaultValues: {
      name: user.name ?? "",
    },
    resolver: valibotResolver(profileSchema),
  });
  const { data: session } = useSession();

  async function onSubmit(data: v.InferInput<typeof profileSchema>) {
    try {
      await editProfile(data);
      form.reset({ name: data.name });
      toast.success("S'ha desat el perfil");
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "edit_profile",
        userId: user.id,
        data,
      });
      toast.error("No s'ha pogut desar el perfil, torna-ho a provar més tard");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p>
              {
                "Aquesta és la informació que es mostra a tots els teus grups i que es pot veure públicament."
              }
            </p>
            <p>
              {
                "La imatge de perfil és la del compte Google si s'entra d'aquesta manera, o la inicial del teu nom en cas contrari"
              }
            </p>
          </AlertDescription>
        </Alert>

        <FormItem>
          <Label>Avatar</Label>
          <div className="pb-2">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
              <AvatarFallback className="bg-secondary text-3xl text-secondary-foreground">
                {user.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </FormItem>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <Label>Nom</Label>
              <FormControl>
                <Input {...field} placeholder="Nom" />
              </FormControl>
              <Label className="text-muted-foreground text-sm italic">
                Aquest nom serà visible públicament a tots els teus grups
              </Label>
            </FormItem>
          )}
        />

        <FormItem>
          <Label>Email</Label>
          <Input value={user.email ?? ""} disabled />
        </FormItem>

        <Button
          className="space-x-2"
          disabled={!form.formState.isDirty || form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <span className="loading loading-spinner" />
          )}
          Desar canvis
        </Button>
      </form>
    </Form>
  );
}
