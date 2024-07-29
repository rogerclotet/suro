"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiGoogle } from "@icons-pack/react-simple-icons";
import type { Session } from "next-auth";
import Image from "next/image";
import { redirect, useSearchParams } from "next/navigation";
import { login } from "./actions";

export default function Login({ session }: { session?: Session | null }) {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("to") ?? "/";

  if (session) {
    return redirect(redirectTo);
  }

  return (
    <div className="container mx-auto mt-8 flex flex-col items-center gap-2 px-10">
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
        <CardContent>
          <form action={login} className="text-center">
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
