import { auth } from "@/auth";
import { getProjects } from "@/server/projects";
import DrawerLayout from "./drawer-layout";
import Profile from "./profile";

export default async function Drawer() {
  const session = await auth();
  if (!session) {
    return null;
  }

  const projects = await getProjects();

  return (
    <DrawerLayout projects={projects}>
      <li>
        <Profile />
      </li>
    </DrawerLayout>
  );
}
