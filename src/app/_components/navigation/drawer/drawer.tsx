import { auth } from "@/auth";
import { getProjects } from "@/server/projects";
import assert from "assert";
import DrawerLayout from "./drawer-layout";
import Profile from "./profile";

export default async function Drawer() {
  const session = await auth();
  assert(session, "Unauthenticated user");

  const projects = await getProjects();

  return (
    <DrawerLayout projects={projects}>
      <li>
        <Profile />
      </li>
    </DrawerLayout>
  );
}
