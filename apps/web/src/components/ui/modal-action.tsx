import { useMediaQuery } from "@uidotdev/usehooks";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { cn } from "@/lib/utils";
import { ClientOnly } from "../client-only";
import { Button, buttonVariants } from "./button";

type Props = {
  title: string;
  description: string;
  actionText: string;
  onAction: () => void;
  variant?: "default" | "destructive";
  trigger: React.ReactNode;
  children?: ReactNode;
};

export default function ModalAction(props: Props) {
  return (
    <ClientOnly>
      <ClientModalAction {...props} />
    </ClientOnly>
  );
}

function ClientModalAction({
  title,
  description,
  actionText,
  onAction,
  children,
  variant = "default",
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [triggerOrigin, setTriggerOrigin] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const isMdOrLarger = useMediaQuery("(min-width: 768px)");
  const tCommon = useTranslations("common");

  if (isMdOrLarger) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <TriggerOriginSlot onOriginChange={setTriggerOrigin}>
            {trigger}
          </TriggerOriginSlot>
        </AlertDialogTrigger>
        <AlertDialogContent
          style={getDialogTransformOriginStyle(triggerOrigin)}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="wrap-anywhere text-wrap">
              {title}
            </AlertDialogTitle>
            {description && (
              <AlertDialogDescription>{description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          {children}
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onAction}
              className={cn(buttonVariants({ variant }))}
            >
              {actionText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="wrap-anywhere text-wrap">{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        {children}
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant={variant} onClick={onAction}>
              {actionText}
            </Button>
          </DrawerClose>
          <DrawerClose asChild>
            <Button variant="outline">{tCommon("cancel")}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
