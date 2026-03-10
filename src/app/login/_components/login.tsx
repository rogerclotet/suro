"use client";

import { SiGoogle } from "@icons-pack/react-simple-icons";
import { Info, Mail } from "lucide-react";
import Image from "next/image";
import { redirect, useSearchParams } from "next/navigation";
import type { Session } from "next-auth";
import { useState } from "react";
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
import { getSafeRedirectTo } from "@/lib/auth-redirect";
import { loginWithGoogle, loginWithResend } from "./actions";

export default function Login({ session }: { session?: Session | null }) {
  const [loggedInWithResend, setLoggedInWithResend] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectTo(searchParams.get("to"));

  if (session) {
    return redirect(redirectTo);
  }

  async function handleResendSignIn(formData?: FormData) {
    await loginWithResend(formData);
    setLoggedInWithResend(true);
  }

  return (
    <div className="container mx-auto flex h-screen w-sm items-center justify-center">
      <Card>
        <CardHeader>
          <div className="mx-auto mb-4 rounded-full bg-background p-4">
            <Image src="/favicon.png" alt="Logo" width={64} height={64} />
          </div>
          <CardTitle className="text-center">Iniciar sessió</CardTitle>
          <CardDescription className="text-center">
            {"Has d'iniciar sessió per a accedir a l'aplicació"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={handleResendSignIn}
            className="space-y-4 rounded-lg border-2 border-muted p-4 text-center"
          >
            <input type="hidden" name="redirectTo" value={redirectTo} />
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
              <Alert>
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
            <input type="hidden" name="redirectTo" value={redirectTo} />
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
