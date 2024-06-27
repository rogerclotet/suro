import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export default async function Login() {
  const session = await auth();

  if (session) {
    redirect("/");
  }

  return (
    <div className="container mt-8 flex flex-col items-center gap-2 px-10">
      <div className="card w-full max-w-80 bg-primary text-primary-content shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Iniciar sessió</h2>
          <p>Has d&apos;iniciar sessió per a accedir a l&apos;aplicació</p>
          <div className="card-actions mt-4">
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
              className="w-full"
            >
              <button className="btn w-full">Entrar amb Google</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
