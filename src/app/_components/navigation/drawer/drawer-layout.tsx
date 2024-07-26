"use client";

import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import ThemeSwitcher from "../../theme-switcher";
import Navbar from "../navbar";
import ProjectSelector from "../project-selector";

export default function DrawerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();
  const { project } = useProjects();

  function handleSelectProject(projectId: string) {
    setIsOpen(false);
    router.push(`/grups/${projectId}/llistes`);
  }

  return (
    <div>
      <nav className="fixed left-0 right-0 top-0 z-40 flex w-full flex-row items-center justify-between gap-2 bg-primary py-2 text-primary-foreground lg:container lg:rounded-b-xl">
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
              <DrawerTitle className="sr-only">Menú lateral</DrawerTitle>

              <ul tabIndex={0} className="flex flex-col gap-2 p-4">
                {children}

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
            </DrawerContent>
          </Drawer>

          <Link
            href="/"
            className="btn btn-ghost flex items-center gap-2 text-xl"
          >
            <Image src="/favicon.png" alt="Logo" width={36} height={36} />

            {project?.name ?? <Skeleton className="h-6 w-24 opacity-20" />}
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <Navbar />
        </div>

        <div className="navbar-end">
          <ThemeSwitcher />
        </div>
      </nav>
    </div>
  );
}
