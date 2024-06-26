import { auth, signOut } from "@/auth";
import ProjectSelector from "./project-dropdown";

export default async function DrawerMenu() {
  const session = await auth();
  if (!session) {
    return null;
  }

  return (
    <ul tabIndex={0} className="menu min-h-full w-80 gap-2 bg-base-200 p-4">
      <li>
        <details className="dropdown">
          <summary>
            <div className="flex flex-row items-center justify-between gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={session.user.image!}
                alt={session.user.name!}
                className="h-8 w-8 rounded-full border-2 border-neutral-content"
              />
              {session.user.name}
            </div>
          </summary>

          <ul tabIndex={0} className="menu mt-2 w-full gap-2">
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <li>
                <button className="h-full w-full">Tancar sessió</button>
              </li>
            </form>
          </ul>
        </details>
      </li>

      <li>
        <ProjectSelector />
      </li>
    </ul>
  );
}
