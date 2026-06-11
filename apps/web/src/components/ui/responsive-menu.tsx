"use client";

import { Slot } from "@radix-ui/react-slot";
import { useIsClient, useMediaQuery } from "@uidotdev/usehooks";
import {
  createContext,
  forwardRef,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// On phones a Radix dropdown's small rows are hard to tap, so below 768px the
// menu becomes a vaul bottom-sheet with large touch targets while desktop keeps
// the dropdown unchanged. This mirrors the Dialog/Drawer split in modal-form.tsx.

type ResponsiveMenuMode = "desktop" | "mobile";

type ResponsiveMenuContextType = {
  mode: ResponsiveMenuMode;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const ResponsiveMenuContext = createContext<ResponsiveMenuContextType | null>(
  null,
);

export function useResponsiveMenu() {
  const context = useContext(ResponsiveMenuContext);
  if (!context) {
    throw new Error("useResponsiveMenu must be used within a ResponsiveMenu");
  }
  return context;
}

/**
 * Like `useResponsiveMenu`, but safe outside a menu (returns null). For
 * modals nested in a menu (whose items preventDefault so the modal can stay
 * mounted) that want to collapse the underlying menu after a successful
 * action instead of dropping the user back onto it.
 */
export function useOptionalResponsiveMenu() {
  return useContext(ResponsiveMenuContext);
}

// Large, finger-friendly row used for every item in the mobile drawer.
const MOBILE_ITEM_CLASSES =
  "flex w-full cursor-pointer select-none items-center gap-3 rounded-md px-4 py-3 text-base outline-hidden transition-colors active:bg-accent [&_svg:not([class*='size-'])]:size-5 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:shrink-0";

function MenuShell({
  mode,
  open,
  setOpen,
  children,
}: ResponsiveMenuContextType & { children: ReactNode }) {
  return (
    <ResponsiveMenuContext.Provider value={{ mode, open, setOpen }}>
      {mode === "desktop" ? (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          {children}
        </DropdownMenu>
      ) : (
        // shouldScaleBackground={false} so the body-scale unwind doesn't fight a
        // modal drawer that opens as this menu closes.
        <Drawer
          open={open}
          onOpenChange={setOpen}
          shouldScaleBackground={false}
        >
          {children}
        </Drawer>
      )}
    </ResponsiveMenuContext.Provider>
  );
}

export function ResponsiveMenu({ children }: { children: ReactNode }) {
  // useMediaQuery is client-only (throws on the server), so — like modal-form.tsx
  // — render the SSR-safe desktop branch until the client mounts, then let
  // ClientResponsiveMenu pick the real mode. useIsClient is false on the first
  // client render too, so this also matches hydration (no mismatch, no vaul on
  // the server).
  const isClient = useIsClient();
  return isClient ? (
    <ClientResponsiveMenu>{children}</ClientResponsiveMenu>
  ) : (
    <DesktopMenuShell>{children}</DesktopMenuShell>
  );
}

function DesktopMenuShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <MenuShell mode="desktop" open={open} setOpen={setOpen}>
      {children}
    </MenuShell>
  );
}

function ClientResponsiveMenu({ children }: { children: ReactNode }) {
  const isMdOrLarger = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(false);
  const mode: ResponsiveMenuMode = isMdOrLarger ? "desktop" : "mobile";
  return (
    <MenuShell mode={mode} open={open} setOpen={setOpen}>
      {children}
    </MenuShell>
  );
}

export function ResponsiveMenuTrigger({ children }: { children: ReactNode }) {
  const { mode } = useResponsiveMenu();
  return mode === "desktop" ? (
    <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
  ) : (
    <DrawerTrigger asChild>{children}</DrawerTrigger>
  );
}

type ResponsiveMenuContentProps = React.ComponentProps<
  typeof DropdownMenuContent
> & {
  // sr-only title for the mobile drawer (Radix dialog a11y requirement).
  title?: string;
};

export function ResponsiveMenuContent({
  children,
  className,
  title = "Menu",
  ...props
}: ResponsiveMenuContentProps) {
  const { mode } = useResponsiveMenu();

  if (mode === "desktop") {
    return (
      <DropdownMenuContent className={className} {...props}>
        {children}
      </DropdownMenuContent>
    );
  }

  // Desktop-only positioning props (align/side/sideOffset) live in `props` and
  // are intentionally dropped here — the drawer is always a full-width sheet.
  return (
    <DrawerContent>
      <DrawerHeader className="sr-only">
        <DrawerTitle>{title}</DrawerTitle>
      </DrawerHeader>
      <div className="flex flex-col gap-1 px-2 pb-[max(env(safe-area-inset-bottom),1rem)]">
        {children}
      </div>
    </DrawerContent>
  );
}

type ResponsiveMenuItemProps = React.ComponentProps<typeof DropdownMenuItem> & {
  asChild?: boolean;
  // Skip closing the menu on tap (e.g. a row that only toggles a Switch).
  closeOnSelect?: boolean;
};

export const ResponsiveMenuItem = forwardRef<
  HTMLDivElement,
  ResponsiveMenuItemProps
>(function ResponsiveMenuItem(
  {
    children,
    className,
    variant = "default",
    inset,
    disabled,
    onSelect,
    onClick,
    asChild,
    closeOnSelect = true,
    ...props
  },
  ref,
) {
  const { mode, setOpen } = useResponsiveMenu();

  // When this item is a modal trigger, the wrapping DrawerTrigger (asChild)
  // injects the modal's open state as `data-state`. We keep the menu open while
  // the modal is open (see onClick), then dismiss the menu once the modal closes
  // (open → closed) so the whole stack tears down together instead of revealing
  // the menu again. Desktop is untouched — its dropdown manages its own state.
  const modalState = (props as { "data-state"?: string })["data-state"];
  const prevModalState = useRef(modalState);
  useEffect(() => {
    if (
      mode === "mobile" &&
      prevModalState.current === "open" &&
      modalState === "closed"
    ) {
      setOpen(false);
    }
    prevModalState.current = modalState;
  }, [mode, modalState, setOpen]);

  if (mode === "desktop") {
    return (
      <DropdownMenuItem
        ref={ref}
        variant={variant}
        inset={inset}
        disabled={disabled}
        onSelect={onSelect}
        onClick={onClick}
        className={className}
        {...props}
      >
        {children}
      </DropdownMenuItem>
    );
  }

  // In mobile mode `onSelect` (a Radix-menu event) doesn't fire on its own. When
  // this item is the child of a modal's DrawerTrigger (asChild), that trigger's
  // open handler arrives via `onClick`, which we invoke below.
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={ref}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      data-variant={variant}
      className={cn(
        MOBILE_ITEM_CLASSES,
        variant === "destructive" &&
          "text-destructive active:bg-destructive/10",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      onClick={(event) => {
        if (disabled) {
          return;
        }
        onClick?.(event);
        // Mirror the desktop dropdown convention: an item whose `onSelect` calls
        // preventDefault is one that opens a modal, and must NOT dismiss the menu.
        // Closing the menu drawer here would unmount the modal that just opened
        // (it lives inside the menu's drawer content), making it flash open and
        // shut. Plain action items have no such `onSelect` and still close.
        let keepMenuOpen = false;
        if (onSelect) {
          const selectEvent = {
            preventDefault: () => {
              keepMenuOpen = true;
            },
          } as unknown as Event;
          onSelect(selectEvent);
        }
        if (closeOnSelect && !keepMenuOpen) {
          setOpen(false);
        }
      }}
      {...props}
    >
      {children}
    </Comp>
  );
});

export function ResponsiveMenuLabel({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuLabel>) {
  const { mode } = useResponsiveMenu();
  if (mode === "desktop") {
    return (
      <DropdownMenuLabel className={className} {...props}>
        {children}
      </DropdownMenuLabel>
    );
  }
  return (
    <div
      className={cn(
        "px-4 py-2 font-medium text-muted-foreground text-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ResponsiveMenuSeparator({ className }: { className?: string }) {
  const { mode } = useResponsiveMenu();
  if (mode === "desktop") {
    return <DropdownMenuSeparator className={className} />;
  }
  return <div className={cn("my-1 h-px bg-border", className)} />;
}
