import { useMediaQuery } from "@uidotdev/usehooks";
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
import { ClientOnly } from "../client-only";
import { Button } from "./button";

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
  const isMdOrLarger = useMediaQuery("(min-width: 768px)");

  const actionButtonStyle =
    variant === "destructive"
      ? "bg-destructive text-destructive-foreground"
      : "bg-primary text-primary-foreground";

  if (isMdOrLarger) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description && (
              <AlertDialogDescription>{description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          {children}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel·lar</AlertDialogCancel>
            <AlertDialogAction onClick={onAction} className={actionButtonStyle}>
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
          <DrawerTitle>{title}</DrawerTitle>
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
            <Button variant="outline">Cancel·lar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
