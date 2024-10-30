"use client";

import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import Navbar from "../navbar";
import ProjectSelector from "../project-selector";
import Profile from "./profile/profile";
import NotificationBell from "./notification-bell/notification-bell";
import ThemeSwitcher from "../../theme-switcher";

export default function DrawerLayout() {
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();
  const { project } = useProjects();

  function handleSelectProject(projectId: string) {
    setIsOpen(false);
    router.push(`/grups/${projectId}/llistes`);
  }

  return (
    <div>
      <nav className="fixed left-0 right-0 top-0 z-40 flex w-full items-center justify-between gap-2 bg-primary py-2 text-primary-foreground lg:container lg:grid lg:grid-cols-3 lg:rounded-b-xl">
        <div className="flex flex-row items-center gap-2">
          <Drawer direction="left" open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Obrir menú lateral"
              >
                <Menu />
              </Button>
            </DrawerTrigger>

            <DrawerContent className="fixed left-0 h-full w-80 max-w-[calc(100vw-2rem)] rounded-none">
              <div className="flex h-full flex-col justify-between gap-4 p-4">
                <div>
                  <DrawerTitle className="sr-only">Menú lateral</DrawerTitle>

                  <ul tabIndex={0} className="flex flex-col gap-2">
                    <li>
                      <Profile onNavigate={() => setIsOpen(false)} />
                    </li>

                    <li>
                      <ProjectSelector onSelect={handleSelectProject} />
                    </li>

                    <li>
                      <Button
                        variant="ghost"
                        asChild
                        className="w-full justify-start"
                      >
                        <Link href="/grups" onClick={() => setIsOpen(false)}>
                          Gestionar grups
                        </Link>
                      </Button>
                    </li>
                  </ul>
                </div>

                <ThemeSwitcher />
              </div>
            </DrawerContent>
          </Drawer>

          <Link
            href="/"
            className="btn btn-ghost flex items-center gap-2 text-xl"
          >
            <Image src="/favicon.png" alt="Logo" width={32} height={32} />

            {project?.name}
          </Link>
        </div>

        <div className="hidden lg:flex lg:justify-center">
          <Navbar />
        </div>

        <div className="text-right">
          <NotificationBell />
        </div>
      </nav>
    </div>
  );
}
