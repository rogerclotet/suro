import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getProjectCategoryId } from "@/server/action-auth";
import { db } from "@/server/db";
import {
  events,
  listItems,
  lists,
  notes,
  pots,
  potToUsers,
  spendings,
} from "@/server/db/schema";
import { getList } from "@/server/lists";
import { getPot } from "@/server/pots";
import { getUserProject } from "@/server/projects";

export const dynamic = "force-dynamic";

type EntityType =
  | "list"
  | "listItem"
  | "category"
  | "event"
  | "note"
  | "pot"
  | "spending";

interface SyncRequest {
  entityType: EntityType;
  operation: "create" | "update" | "delete";
  entityId: string;
  listId?: string;
  projectId?: string;
  potId?: string;
  payload: Record<string, unknown>;
  clientTimestamp: number;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: SyncRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const {
    entityType,
    operation,
    entityId,
    listId,
    projectId,
    potId,
    payload,
    clientTimestamp,
  } = body;

  try {
    switch (entityType) {
      case "listItem":
        return await handleListItemSync(
          session.user.id,
          operation,
          entityId,
          listId!,
          payload,
          clientTimestamp,
        );

      case "list":
        return await handleListSync(
          session.user.id,
          operation,
          entityId,
          projectId!,
          payload,
          clientTimestamp,
        );

      case "event":
        return await handleEventSync(
          session.user.id,
          operation,
          entityId,
          projectId!,
          payload,
          clientTimestamp,
        );

      case "note":
        return await handleNoteSync(
          session.user.id,
          operation,
          entityId,
          projectId!,
          payload,
          clientTimestamp,
        );

      case "pot":
        return await handlePotSync(
          session.user.id,
          operation,
          entityId,
          projectId!,
          payload,
          clientTimestamp,
        );

      case "spending":
        return await handleSpendingSync(
          session.user.id,
          operation,
          entityId,
          potId!,
          payload,
          clientTimestamp,
        );

      default:
        return Response.json(
          { message: "Unsupported entity type" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Sync error:", error);
    return Response.json(
      { message: (error as Error).message || "Sync failed" },
      { status: 500 },
    );
  }
}

async function handleListItemSync(
  userId: string,
  operation: "create" | "update" | "delete",
  entityId: string,
  listId: string,
  payload: Record<string, unknown>,
  clientTimestamp: number,
) {
  const list = await getList(listId);
  if (!list) {
    return Response.json({ message: "List not found" }, { status: 404 });
  }

  const project = await getUserProject(list.projectId);
  if (!project) {
    return Response.json({ message: "Unauthorized" }, { status: 403 });
  }

  switch (operation) {
    case "create": {
      const existingItem = await db.query.listItems.findFirst({
        where: eq(listItems.id, entityId),
      });

      if (existingItem) {
        // Item already exists, check for conflict
        if (
          existingItem.updatedAt &&
          existingItem.updatedAt.getTime() > clientTimestamp
        ) {
          return Response.json(
            {
              message: "Conflict",
              serverData: {
                ...existingItem,
                updatedAt: existingItem.updatedAt?.getTime(),
                createdAt: existingItem.createdAt?.getTime(),
              },
            },
            { status: 409 },
          );
        }
        // Return existing item
        return Response.json({
          ...existingItem,
          updatedAt: existingItem.updatedAt?.getTime(),
          createdAt: existingItem.createdAt?.getTime(),
        });
      }

      const categoryId = await getProjectCategoryId(
        list.projectId,
        payload.categoryId as string | null,
      );

      const [created] = await db
        .insert(listItems)
        .values({
          id: entityId.startsWith("local-") ? undefined : entityId,
          name: payload.name as string,
          details: (payload.details as string) || null,
          completed: (payload.completed as boolean) || false,
          listId: list.id,
          categoryId,
          createdBy: userId,
        })
        .returning();

      if (!created) {
        return Response.json(
          { message: "Failed to create item" },
          { status: 500 },
        );
      }

      return Response.json({
        ...created,
        updatedAt: created.updatedAt?.getTime(),
        createdAt: created.createdAt?.getTime(),
      });
    }

    case "update": {
      const existingItem = await db.query.listItems.findFirst({
        where: and(eq(listItems.id, entityId), eq(listItems.listId, list.id)),
      });

      if (!existingItem) {
        return Response.json({ message: "Item not found" }, { status: 404 });
      }

      // Check for conflict (server was modified after client timestamp)
      const forceOverwrite = payload._forceOverwrite as boolean;
      if (
        !forceOverwrite &&
        existingItem.updatedAt &&
        existingItem.updatedAt.getTime() > clientTimestamp
      ) {
        return Response.json(
          {
            message: "Conflict",
            serverData: {
              ...existingItem,
              updatedAt: existingItem.updatedAt?.getTime(),
              createdAt: existingItem.createdAt?.getTime(),
            },
          },
          { status: 409 },
        );
      }

      const categoryId = await getProjectCategoryId(
        list.projectId,
        payload.categoryId as string | null,
      );

      const [updated] = await db
        .update(listItems)
        .set({
          name: payload.name as string,
          details: (payload.details as string) || null,
          completed: payload.completed as boolean,
          categoryId,
          updatedBy: userId,
        })
        .where(and(eq(listItems.id, entityId), eq(listItems.listId, list.id)))
        .returning();

      if (!updated) {
        return Response.json(
          { message: "Failed to update item" },
          { status: 500 },
        );
      }

      return Response.json({
        ...updated,
        updatedAt: updated.updatedAt?.getTime(),
        createdAt: updated.createdAt?.getTime(),
      });
    }

    case "delete": {
      await db
        .delete(listItems)
        .where(and(eq(listItems.id, entityId), eq(listItems.listId, list.id)));

      return Response.json({ deleted: true });
    }
  }
}

async function handleListSync(
  userId: string,
  operation: "create" | "update" | "delete",
  entityId: string,
  projectId: string,
  payload: Record<string, unknown>,
  clientTimestamp: number,
) {
  const project = await getUserProject(projectId);
  if (!project) {
    return Response.json({ message: "Unauthorized" }, { status: 403 });
  }

  switch (operation) {
    case "create": {
      const existingList = await db.query.lists.findFirst({
        where: eq(lists.id, entityId),
      });

      if (existingList) {
        if (
          existingList.updatedAt &&
          existingList.updatedAt.getTime() > clientTimestamp
        ) {
          return Response.json(
            {
              message: "Conflict",
              serverData: {
                ...existingList,
                updatedAt: existingList.updatedAt?.getTime(),
                createdAt: existingList.createdAt?.getTime(),
              },
            },
            { status: 409 },
          );
        }
        return Response.json({
          ...existingList,
          updatedAt: existingList.updatedAt?.getTime(),
          createdAt: existingList.createdAt?.getTime(),
        });
      }

      const [created] = await db
        .insert(lists)
        .values({
          id: entityId.startsWith("local-") ? undefined : entityId,
          name: payload.name as string,
          description: (payload.description as string) || null,
          projectId,
          createdBy: userId,
          favorite: (payload.favorite as boolean) || false,
        })
        .returning();

      if (!created) {
        return Response.json(
          { message: "Failed to create list" },
          { status: 500 },
        );
      }

      return Response.json({
        ...created,
        updatedAt: created.updatedAt?.getTime(),
        createdAt: created.createdAt?.getTime(),
      });
    }

    case "update": {
      const existingList = await db.query.lists.findFirst({
        where: and(eq(lists.id, entityId), eq(lists.projectId, projectId)),
      });

      if (!existingList) {
        return Response.json({ message: "List not found" }, { status: 404 });
      }

      const forceOverwrite = payload._forceOverwrite as boolean;
      if (
        !forceOverwrite &&
        existingList.updatedAt &&
        existingList.updatedAt.getTime() > clientTimestamp
      ) {
        return Response.json(
          {
            message: "Conflict",
            serverData: {
              ...existingList,
              updatedAt: existingList.updatedAt?.getTime(),
              createdAt: existingList.createdAt?.getTime(),
            },
          },
          { status: 409 },
        );
      }

      const [updated] = await db
        .update(lists)
        .set({
          name: payload.name as string,
          description: (payload.description as string) || null,
          favorite: payload.favorite as boolean,
          updatedBy: userId,
        })
        .where(and(eq(lists.id, entityId), eq(lists.projectId, projectId)))
        .returning();

      if (!updated) {
        return Response.json(
          { message: "Failed to update list" },
          { status: 500 },
        );
      }

      return Response.json({
        ...updated,
        updatedAt: updated.updatedAt?.getTime(),
        createdAt: updated.createdAt?.getTime(),
      });
    }

    case "delete": {
      await db
        .delete(lists)
        .where(and(eq(lists.id, entityId), eq(lists.projectId, projectId)));

      return Response.json({ deleted: true });
    }
  }
}

async function handleEventSync(
  userId: string,
  operation: "create" | "update" | "delete",
  entityId: string,
  projectId: string,
  payload: Record<string, unknown>,
  clientTimestamp: number,
) {
  const project = await getUserProject(projectId);
  if (!project) {
    return Response.json({ message: "Unauthorized" }, { status: 403 });
  }

  switch (operation) {
    case "create": {
      const existingEvent = await db.query.events.findFirst({
        where: eq(events.id, entityId),
      });

      if (existingEvent) {
        if (
          existingEvent.updatedAt &&
          existingEvent.updatedAt.getTime() > clientTimestamp
        ) {
          return Response.json(
            {
              message: "Conflict",
              serverData: {
                ...existingEvent,
                startAt: existingEvent.startAt.getTime(),
                endAt: existingEvent.endAt.getTime(),
                updatedAt: existingEvent.updatedAt?.getTime(),
                createdAt: existingEvent.createdAt?.getTime(),
              },
            },
            { status: 409 },
          );
        }
        return Response.json({
          ...existingEvent,
          startAt: existingEvent.startAt.getTime(),
          endAt: existingEvent.endAt.getTime(),
          updatedAt: existingEvent.updatedAt?.getTime(),
          createdAt: existingEvent.createdAt?.getTime(),
        });
      }

      const [created] = await db
        .insert(events)
        .values({
          id: entityId.startsWith("local-") ? undefined : entityId,
          name: payload.name as string,
          description: (payload.description as string) || null,
          startAt: new Date(payload.startAt as number),
          endAt: new Date(payload.endAt as number),
          allDay: (payload.allDay as boolean) || false,
          projectId,
          createdBy: userId,
        })
        .returning();

      if (!created) {
        return Response.json(
          { message: "Failed to create event" },
          { status: 500 },
        );
      }

      return Response.json({
        ...created,
        startAt: created.startAt.getTime(),
        endAt: created.endAt.getTime(),
        updatedAt: created.updatedAt?.getTime(),
        createdAt: created.createdAt?.getTime(),
      });
    }

    case "update": {
      const existingEvent = await db.query.events.findFirst({
        where: and(eq(events.id, entityId), eq(events.projectId, projectId)),
      });

      if (!existingEvent) {
        return Response.json({ message: "Event not found" }, { status: 404 });
      }

      const forceOverwrite = payload._forceOverwrite as boolean;
      if (
        !forceOverwrite &&
        existingEvent.updatedAt &&
        existingEvent.updatedAt.getTime() > clientTimestamp
      ) {
        return Response.json(
          {
            message: "Conflict",
            serverData: {
              ...existingEvent,
              startAt: existingEvent.startAt.getTime(),
              endAt: existingEvent.endAt.getTime(),
              updatedAt: existingEvent.updatedAt?.getTime(),
              createdAt: existingEvent.createdAt?.getTime(),
            },
          },
          { status: 409 },
        );
      }

      const [updated] = await db
        .update(events)
        .set({
          name: payload.name as string,
          description: (payload.description as string) || null,
          startAt: new Date(payload.startAt as number),
          endAt: new Date(payload.endAt as number),
          allDay: payload.allDay as boolean,
          updatedBy: userId,
        })
        .where(and(eq(events.id, entityId), eq(events.projectId, projectId)))
        .returning();

      if (!updated) {
        return Response.json(
          { message: "Failed to update event" },
          { status: 500 },
        );
      }

      return Response.json({
        ...updated,
        startAt: updated.startAt.getTime(),
        endAt: updated.endAt.getTime(),
        updatedAt: updated.updatedAt?.getTime(),
        createdAt: updated.createdAt?.getTime(),
      });
    }

    case "delete": {
      await db
        .delete(events)
        .where(and(eq(events.id, entityId), eq(events.projectId, projectId)));

      return Response.json({ deleted: true });
    }
  }
}

async function handleNoteSync(
  userId: string,
  operation: "create" | "update" | "delete",
  entityId: string,
  projectId: string,
  payload: Record<string, unknown>,
  clientTimestamp: number,
) {
  const project = await getUserProject(projectId);
  if (!project) {
    return Response.json({ message: "Unauthorized" }, { status: 403 });
  }

  switch (operation) {
    case "create": {
      const existingNote = await db.query.notes.findFirst({
        where: eq(notes.id, entityId),
      });

      if (existingNote) {
        if (
          existingNote.updatedAt &&
          existingNote.updatedAt.getTime() > clientTimestamp
        ) {
          return Response.json(
            {
              message: "Conflict",
              serverData: {
                ...existingNote,
                updatedAt: existingNote.updatedAt?.getTime(),
                createdAt: existingNote.createdAt?.getTime(),
              },
            },
            { status: 409 },
          );
        }
        return Response.json({
          ...existingNote,
          updatedAt: existingNote.updatedAt?.getTime(),
          createdAt: existingNote.createdAt?.getTime(),
        });
      }

      const [created] = await db
        .insert(notes)
        .values({
          id: entityId.startsWith("local-") ? undefined : entityId,
          name: payload.name as string,
          contents: payload.contents as string,
          format: payload.format as string,
          projectId,
          createdBy: userId,
        })
        .returning();

      if (!created) {
        return Response.json(
          { message: "Failed to create note" },
          { status: 500 },
        );
      }

      return Response.json({
        ...created,
        updatedAt: created.updatedAt?.getTime(),
        createdAt: created.createdAt?.getTime(),
      });
    }

    case "update": {
      const existingNote = await db.query.notes.findFirst({
        where: and(eq(notes.id, entityId), eq(notes.projectId, projectId)),
      });

      if (!existingNote) {
        return Response.json({ message: "Note not found" }, { status: 404 });
      }

      const forceOverwrite = payload._forceOverwrite as boolean;
      if (
        !forceOverwrite &&
        existingNote.updatedAt &&
        existingNote.updatedAt.getTime() > clientTimestamp
      ) {
        return Response.json(
          {
            message: "Conflict",
            serverData: {
              ...existingNote,
              updatedAt: existingNote.updatedAt?.getTime(),
              createdAt: existingNote.createdAt?.getTime(),
            },
          },
          { status: 409 },
        );
      }

      const [updated] = await db
        .update(notes)
        .set({
          name: payload.name as string,
          contents: payload.contents as string,
          format: payload.format as string,
          updatedBy: userId,
        })
        .where(and(eq(notes.id, entityId), eq(notes.projectId, projectId)))
        .returning();

      if (!updated) {
        return Response.json(
          { message: "Failed to update note" },
          { status: 500 },
        );
      }

      return Response.json({
        ...updated,
        updatedAt: updated.updatedAt?.getTime(),
        createdAt: updated.createdAt?.getTime(),
      });
    }

    case "delete": {
      await db
        .delete(notes)
        .where(and(eq(notes.id, entityId), eq(notes.projectId, projectId)));

      return Response.json({ deleted: true });
    }
  }
}

async function handlePotSync(
  userId: string,
  operation: "create" | "update" | "delete",
  entityId: string,
  projectId: string,
  payload: Record<string, unknown>,
  _clientTimestamp: number,
) {
  const project = await getUserProject(projectId);
  if (!project) {
    return Response.json({ message: "Unauthorized" }, { status: 403 });
  }

  switch (operation) {
    case "create": {
      const existingPot = await db.query.pots.findFirst({
        where: eq(pots.id, entityId),
      });

      if (existingPot) {
        return Response.json({
          ...existingPot,
          settledAt: existingPot.settledAt?.getTime() ?? null,
          createdAt: existingPot.createdAt?.getTime(),
        });
      }

      const [created] = await db
        .insert(pots)
        .values({
          id: entityId.startsWith("local-") ? undefined : entityId,
          name: payload.name as string,
          projectId,
          createdBy: userId,
        })
        .returning();

      if (!created) {
        return Response.json(
          { message: "Failed to create pot" },
          { status: 500 },
        );
      }

      // Add pot members
      const memberIds = payload.memberIds as string[];
      if (memberIds && memberIds.length > 0) {
        await db.insert(potToUsers).values(
          memberIds.map((memberId) => ({
            potId: created.id,
            userId: memberId,
          })),
        );
      }

      return Response.json({
        ...created,
        settledAt: created.settledAt?.getTime() ?? null,
        createdAt: created.createdAt?.getTime(),
      });
    }

    case "update": {
      const existingPot = await db.query.pots.findFirst({
        where: and(eq(pots.id, entityId), eq(pots.projectId, projectId)),
      });

      if (!existingPot) {
        return Response.json({ message: "Pot not found" }, { status: 404 });
      }

      const [updated] = await db
        .update(pots)
        .set({
          name: payload.name as string,
          settledAt: payload.settledAt
            ? new Date(payload.settledAt as number)
            : null,
        })
        .where(and(eq(pots.id, entityId), eq(pots.projectId, projectId)))
        .returning();

      if (!updated) {
        return Response.json(
          { message: "Failed to update pot" },
          { status: 500 },
        );
      }

      return Response.json({
        ...updated,
        settledAt: updated.settledAt?.getTime() ?? null,
        createdAt: updated.createdAt?.getTime(),
      });
    }

    case "delete": {
      await db
        .delete(pots)
        .where(and(eq(pots.id, entityId), eq(pots.projectId, projectId)));

      return Response.json({ deleted: true });
    }
  }
}

async function handleSpendingSync(
  userId: string,
  operation: "create" | "update" | "delete",
  entityId: string,
  potId: string,
  payload: Record<string, unknown>,
  _clientTimestamp: number,
) {
  const pot = await getPot(potId);
  if (!pot) {
    return Response.json({ message: "Pot not found" }, { status: 404 });
  }

  const project = await getUserProject(pot.projectId);
  if (!project) {
    return Response.json({ message: "Unauthorized" }, { status: 403 });
  }

  switch (operation) {
    case "create": {
      const existingSpending = await db.query.spendings.findFirst({
        where: eq(spendings.id, entityId),
      });

      if (existingSpending) {
        return Response.json({
          ...existingSpending,
          createdAt: existingSpending.createdAt?.getTime(),
        });
      }

      const [created] = await db
        .insert(spendings)
        .values({
          id: entityId.startsWith("local-") ? undefined : entityId,
          amount: Math.round((payload.amount as number) * 100), // Store in cents
          currency: "EUR",
          description: (payload.description as string) || null,
          from: payload.from as string,
          to: payload.to as string,
          projectId: pot.projectId,
          potId,
          createdBy: userId,
        })
        .returning();

      if (!created) {
        return Response.json(
          { message: "Failed to create spending" },
          { status: 500 },
        );
      }

      // Reopen the pot if it was settled
      if (pot.settledAt !== null) {
        await db
          .update(pots)
          .set({ settledAt: null })
          .where(eq(pots.id, potId));
      }

      return Response.json({
        ...created,
        createdAt: created.createdAt?.getTime(),
      });
    }

    case "update": {
      const existingSpending = await db.query.spendings.findFirst({
        where: and(eq(spendings.id, entityId), eq(spendings.potId, potId)),
      });

      if (!existingSpending) {
        return Response.json(
          { message: "Spending not found" },
          { status: 404 },
        );
      }

      const [updated] = await db
        .update(spendings)
        .set({
          amount: Math.round((payload.amount as number) * 100),
          description: (payload.description as string) || null,
          from: payload.from as string,
          to: payload.to as string,
        })
        .where(and(eq(spendings.id, entityId), eq(spendings.potId, potId)))
        .returning();

      if (!updated) {
        return Response.json(
          { message: "Failed to update spending" },
          { status: 500 },
        );
      }

      return Response.json({
        ...updated,
        createdAt: updated.createdAt?.getTime(),
      });
    }

    case "delete": {
      await db
        .delete(spendings)
        .where(and(eq(spendings.id, entityId), eq(spendings.potId, potId)));

      return Response.json({ deleted: true });
    }
  }
}
