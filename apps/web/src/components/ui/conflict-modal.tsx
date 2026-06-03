"use client";

import { AlertTriangle, Check, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  type Conflict,
  type ConflictResolution,
  ConflictResolver,
} from "@/lib/offline/conflict-resolver";

export function ConflictModal() {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Load conflicts on mount and when sync-conflict events fire
  useEffect(() => {
    const loadConflicts = async () => {
      try {
        const c = await ConflictResolver.getConflicts();
        setConflicts(c);
      } catch {
        // IndexedDB not available
      }
    };

    loadConflicts();

    const handleConflict = () => {
      loadConflicts();
    };

    window.addEventListener("sync-conflict", handleConflict);
    return () => window.removeEventListener("sync-conflict", handleConflict);
  }, []);

  const conflict = conflicts[currentIndex];
  const totalConflicts = conflicts.length;

  if (!conflict || totalConflicts === 0) {
    return null;
  }

  const handleResolve = (resolution: ConflictResolution) => {
    startTransition(async () => {
      try {
        await ConflictResolver.resolveManually(
          conflict.entityType as "list" | "listItem" | "category",
          conflict.entityId,
          resolution,
        );

        toast.success("Conflicte resolt");

        // Reload conflicts
        const c = await ConflictResolver.getConflicts();
        setConflicts(c);

        if (currentIndex >= c.length) {
          setCurrentIndex(0);
        }
      } catch (error) {
        toast.error("No s'ha pogut resoldre el conflicte");
        console.error("Failed to resolve conflict:", error);
      }
    });
  };

  const localValue = getDisplayValue(conflict.localData);
  const serverValue = getDisplayValue(conflict.serverData);

  return (
    <AlertDialog open={totalConflicts > 0}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            Conflicte de sincronització
          </AlertDialogTitle>
          <AlertDialogDescription>
            {totalConflicts > 1 && (
              <span className="mb-2 block text-sm">
                Conflicte {currentIndex + 1} de {totalConflicts}
              </span>
            )}
            Aquest element ha estat modificat mentre estaves sense connexió.
            Tria quina versió vols mantenir.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-4">
          <div className="rounded-lg border p-3">
            <div className="mb-1 font-medium text-muted-foreground text-xs">
              La teva versió (local)
            </div>
            <div className="text-sm">{localValue.name}</div>
            {localValue.details && (
              <div className="mt-1 text-muted-foreground text-xs">
                {localValue.details}
              </div>
            )}
            {localValue.completed !== undefined && (
              <div className="mt-1 flex items-center gap-1 text-xs">
                {localValue.completed ? (
                  <>
                    <Check className="size-3 text-green-500" />
                    <span>Completat</span>
                  </>
                ) : (
                  <>
                    <X className="size-3 text-muted-foreground" />
                    <span>Pendent</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="rounded-lg border p-3">
            <div className="mb-1 font-medium text-muted-foreground text-xs">
              Versió del servidor
            </div>
            <div className="text-sm">{serverValue.name}</div>
            {serverValue.details && (
              <div className="mt-1 text-muted-foreground text-xs">
                {serverValue.details}
              </div>
            )}
            {serverValue.completed !== undefined && (
              <div className="mt-1 flex items-center gap-1 text-xs">
                {serverValue.completed ? (
                  <>
                    <Check className="size-3 text-green-500" />
                    <span>Completat</span>
                  </>
                ) : (
                  <>
                    <X className="size-3 text-muted-foreground" />
                    <span>Pendent</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => handleResolve("keep-server")}
            disabled={isPending}
            className="flex-1"
          >
            Mantenir servidor
          </Button>
          <Button
            onClick={() => handleResolve("keep-local")}
            disabled={isPending}
            className="flex-1"
          >
            Mantenir la meva
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function getDisplayValue(data: Record<string, unknown>): {
  name: string;
  details?: string;
  completed?: boolean;
} {
  return {
    name: (data.name as string) || "Sense nom",
    details: data.details as string | undefined,
    completed: data.completed as boolean | undefined,
  };
}
