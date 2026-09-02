"use client";

import { useIsClient, useMediaQuery } from "@uidotdev/usehooks";
import { useTranslations } from "next-intl";
import { createContext, type ReactNode, useContext, useState } from "react";
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
import {
  getDialogTransformOriginStyle,
  TriggerOriginSlot,
} from "@/components/ui/trigger-origin";

type ModalFormContextType = {
  close: () => void;
};

const ModalFormContext = createContext<ModalFormContextType | null>(null);

export function useModalForm() {
  const context = useContext(ModalFormContext);
  if (!context) {
    throw new Error("useModalForm must be used within ModalForm");
  }
  return context;
}

type Props = {
  trigger: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
};

// Render the trigger immediately so item text is visible during SSR and before
// hydration. Only gate the dialog/drawer itself on client readiness, since it
// depends on useMediaQuery which requires a DOM environment.
export default function ModalForm(props: Props) {
  const isClient = useIsClient();

  if (!isClient) {
    return <>{props.trigger}</>;
  }

  return <ClientModalForm {...props} />;
}

function ClientModalForm({ trigger, title, description, children }: Props) {
  const [open, setOpen] = useState(false);
  const [triggerOrigin, setTriggerOrigin] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const isMdOrLarger = useMediaQuery("(min-width: 768px)");
  const tCommon = useTranslations("common");

  const close = () => setOpen(false);

  if (isMdOrLarger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <TriggerOriginSlot onOriginChange={setTriggerOrigin}>
            {trigger}
          </TriggerOriginSlot>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-[425px]"
          style={getDialogTransformOriginStyle(triggerOrigin)}
        >
          <DialogHeader>
            <DialogTitle className="wrap-anywhere text-wrap">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          <ModalFormContext.Provider value={{ close }}>
            {children}
          </ModalFormContext.Provider>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="flex max-h-[92dvh] flex-col">
        <DrawerHeader className="shrink-0">
          <DrawerTitle className="wrap-anywhere text-wrap">{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        {/* Scrollable body so the create/save button and date picker stay
            reachable when the mobile keyboard covers the lower half. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2">
          <ModalFormContext.Provider value={{ close }}>
            {children}
          </ModalFormContext.Provider>
        </div>
        <DrawerFooter className="shrink-0 pt-2">
          <DrawerClose asChild>
            <Button variant="outline">{tCommon("cancel")}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
