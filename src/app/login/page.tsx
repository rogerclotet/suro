import { signIn } from "@/auth";

export default function Login() {
  return (
    <div className="container mt-8 flex flex-col items-center gap-2">
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
      >
        <button className="btn">Entrar amb Google</button>
      </form>
    </div>
  );
}
