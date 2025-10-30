"use client";

import { useMediaQuery } from "@uidotdev/usehooks";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ClientOnly } from "../client-only";

type Props = {
  triggerRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  description: string;
  children: React.ReactNode;
};

export default function ModalForm(props: Props) {
  return (
    <ClientOnly>
      <ClientModalForm {...props} />
    </ClientOnly>
  );
}

function ClientModalForm({ triggerRef, title, description, children }: Props) {
  const [open, setOpen] = React.useState(false);
  const isMdOrLarger = useMediaQuery("(min-width: 768px)");

  if (isMdOrLarger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div className="hidden" ref={triggerRef} />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <div className="hidden" ref={triggerRef} />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4">{children}</div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel·lar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
