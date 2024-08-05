"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { captureException } from "@sentry/nextjs";
import type { User } from "next-auth";
import { useLogger } from "next-axiom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import { editProfile } from "./actions";
import { profileSchema } from "./data";

export default function ProfileEditor({ user }: { user: User }) {
  const form = useForm<v.InferInput<typeof profileSchema>>({
    defaultValues: {
      name: user.name ?? "",
    },
    resolver: valibotResolver(profileSchema),
  });
  const log = useLogger();

  async function onSubmit(data: v.InferInput<typeof profileSchema>) {
    try {
      await editProfile(data);
      form.reset({ name: data.name });
      toast.success("S'ha desat el perfil");
    } catch (e) {
      captureException(e);
      log.error("Error saving profile", { error: e, userId: user.id, data });
      toast.error("No s'ha pogut desar el perfil, torna-ho a provar més tard");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-lg font-semibold">Editar informació:</h2>

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
          <Label className="text-sm italic text-muted-foreground">
            {
              "Ara mateix s'utilitza la foto de perfil del compte Google si s'entra d'aquesta manera, o la inicial en cas contrari"
            }
          </Label>
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
              <Label className="text-sm italic text-muted-foreground">
                Aquest nom serà visible públicament a tots els teus grups
              </Label>
            </FormItem>
          )}
        />

        <FormItem>
          <Label>Email</Label>
          <FormControl>
            <Input value={user.email ?? ""} disabled />
          </FormControl>
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
