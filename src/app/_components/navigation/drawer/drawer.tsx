import { auth } from "@/auth";
import { getProjects } from "@/server/projects";
import ProjectSelector from "../project-dropdown";
import DrawerLayout from "./drawer-layout";
import Profile from "./profile";

export default async function Drawer() {
  const session = await auth();
  if (!session) {
    return null;
  }

  const projects = await getProjects();

  return (
    <DrawerLayout>
      <>
        <li>
          <Profile />
        </li>
        <li>
          <ProjectSelector projects={projects} />
        </li>
      </>
    </DrawerLayout>
  );
}
