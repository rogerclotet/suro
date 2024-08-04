import { auth } from "@/auth";
import DrawerLayout from "./drawer-layout";

export default async function Drawer() {
  const session = await auth();
  if (!session) {
    return null;
  }

  return <DrawerLayout />;
}
