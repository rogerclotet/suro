"use client";

import type { Event } from "@/app/_data/event";
import type { List } from "@/app/_data/list";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, ListPlus, ListTodo, Settings, Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { createLinkedList } from "../actions";
import DeleteEventModal from "./delete-event-modal";
import EditEventForm from "./edit-event-form";
import LinkListForm from "./link-list-form";

export default function SettingsMenu({
  event,
  list,
}: {
  event: Event;
  list: List | undefined;
}) {
  const editDialogRef = React.useRef<HTMLDivElement>(null);
  const deleteDialogRef = React.useRef<HTMLDivElement>(null);
  const linkListRef = React.useRef<HTMLDivElement>(null);

  async function handleCreateLinkedList() {
    try {
      await createLinkedList(event);
      toast.success("Llista creada correctament");
    } catch (e) {
      console.error(e);
      toast.error("No s'ha pogut crear la llista. Torna-ho a provar més tard");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => editDialogRef.current?.click()}
            className="cursor-pointer gap-2"
          >
            <Edit />
            Editar esdeveniment
          </DropdownMenuItem>
          {list === undefined && (
            <>
              <DropdownMenuItem
                onClick={handleCreateLinkedList}
                className="cursor-pointer gap-2"
              >
                <ListPlus />
                Crear llista
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => linkListRef.current?.click()}
                className="cursor-pointer gap-2"
              >
                <ListTodo />
                Enllaçar llista existent
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem
            onClick={() => deleteDialogRef.current?.click()}
            className="cursor-pointer gap-2 hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 />
            Eliminar esdeveniment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LinkListForm triggerRef={linkListRef} event={event} />
      <EditEventForm triggerRef={editDialogRef} event={event} />
      <DeleteEventModal triggerRef={deleteDialogRef} event={event} />
    </>
  );
}
