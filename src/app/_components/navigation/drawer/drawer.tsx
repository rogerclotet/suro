import { auth } from "@/auth";
import DrawerLayout from "./drawer-layout";
import Profile from "./profile";

export default async function Drawer() {
  const session = await auth();
  if (!session) {
    return null;
  }

  return (
    <DrawerLayout>
      <Profile />
    </DrawerLayout>
  );
}
