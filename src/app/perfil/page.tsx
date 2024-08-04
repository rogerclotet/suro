"use client";

import { useSession } from "next-auth/react";

export default function PerfilPage() {
  const session = useSession();

  return (
    <div className="space-y-4">
      <h1 className="mt-1 text-xl font-semibold">Perfil</h1>

      <p>Hola {session.data?.user.name},</p>
      <p>Aquí podràs editar el teu perfil.</p>
    </div>
  );
}
