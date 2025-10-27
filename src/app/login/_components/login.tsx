"use client";

import { SiGoogle } from "@icons-pack/react-simple-icons";
import { Info, Mail } from "lucide-react";
import Image from "next/image";
import { redirect, useSearchParams } from "next/navigation";
import type { Session } from "next-auth";
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginWithGoogle, loginWithResend } from "./actions";

export default function Login({ session }: { session?: Session | null }) {
  const [loggedInWithResend, setLoggedInWithResend] = React.useState(false);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("to") ?? "/";

  if (session) {
    return redirect(redirectTo);
  }

  async function handleResendSignIn(formData?: FormData) {
    await loginWithResend(formData);
    setLoggedInWithResend(true);
  }

  return (
    <div className="container mx-auto mt-8 flex w-md flex-col items-center gap-2 px-10">
      <Card>
        <CardHeader>
          <div className="mx-auto mb-4 rounded-full bg-background p-4">
            <Image src="/favicon.png" alt="Logo" width={64} height={64} />
          </div>
          <CardTitle className="text-center">Iniciar sessió</CardTitle>
          <CardDescription>
            {"Has d'iniciar sessió per a accedir a l'aplicació"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={handleResendSignIn}
            className="space-y-4 rounded-lg border-2 border-muted p-4 text-center"
          >
            <Input
              name="email"
              type="email"
              placeholder="exemple@exemple.com"
            />
            <Button className="gap-4">
              <Mail />
              Entrar amb email
            </Button>

            {loggedInWithResend && (
              <Alert className="text-left text-secondary">
                <Info className="h-4 w-4" />
                <AlertTitle>Correu enviat</AlertTitle>
                <AlertDescription className="text-wrap">
                  {
                    "T'hem enviat un email amb un enllaç per iniciar la sessió. Comprova la safata d'entrada."
                  }
                </AlertDescription>
              </Alert>
            )}
          </form>
          <form action={loginWithGoogle} className="text-center">
            <Button className="gap-4">
              <SiGoogle />
              Entrar amb Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
