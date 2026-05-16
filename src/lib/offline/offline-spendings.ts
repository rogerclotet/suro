import { nanoid } from "nanoid";
import type { Pot } from "@/app/_data/pot";
import type { Spending } from "@/app/_data/spending";
import { createPot as serverCreatePot } from "@/app/[locale]/groups/[projectId]/expenses/_components/create-pot-button/actions";
import { createSpending as serverCreateSpending } from "@/app/[locale]/groups/[projectId]/expenses/_components/create-spending-button/actions";
import { db } from "./db";
import { syncManager } from "./sync-manager";

async function isActuallyOnline(): Promise<boolean> {
  if (!navigator.onLine) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const response = await fetch("/api/health", {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

// Pot actions
export interface PotFormData {
  name: string;
  memberIds: string[];
}

export async function createPotOffline(
  projectId: string,
  data: PotFormData,
): Promise<string | undefined> {
  const online = await isActuallyOnline();

  if (online) {
    try {
      const potId = await serverCreatePot(projectId, data);
      return potId;
    } catch (error) {
      console.warn(
        "Server action failed, falling back to offline mode:",
        error,
      );
    }
  }

  const entityId = `local-${nanoid()}`;
  const now = Date.now();

  await db.pots.add({
    id: entityId,
    name: data.name,
    projectId,
    settledAt: null,
    createdAt: now,
    createdBy: "",
    _syncStatus: "pending",
    _localVersion: 1,
    _serverVersion: 0,
    _lastModified: now,
  });

  await syncManager.enqueue({
    entityType: "pot",
    operation: "create",
    entityId,
    projectId,
    payload: {
      name: data.name,
      memberIds: data.memberIds,
    },
  });

  return entityId;
}

// Spending actions
export interface SpendingFormData {
  amount: number;
  description?: string;
  from: string;
  to?: string;
}

export async function createSpendingOffline(
  pot: Pot,
  data: SpendingFormData,
): Promise<string | undefined> {
  const online = await isActuallyOnline();

  if (online) {
    try {
      await serverCreateSpending(pot.id, {
        amount: data.amount,
        description: data.description ?? "",
        from: data.from,
        to: data.to,
      });
      return undefined;
    } catch (error) {
      console.warn(
        "Server action failed, falling back to offline mode:",
        error,
      );
    }
  }

  const entityId = `local-${nanoid()}`;
  const now = Date.now();

  await db.spendings.add({
    id: entityId,
    amount: Math.round(data.amount * 100), // Store in cents
    currency: "EUR",
    description: data.description ?? null,
    from: data.from,
    to: data.to ?? null,
    projectId: pot.projectId,
    potId: pot.id,
    createdAt: now,
    createdBy: "",
    _syncStatus: "pending",
    _localVersion: 1,
    _serverVersion: 0,
    _lastModified: now,
  });

  await syncManager.enqueue({
    entityType: "spending",
    operation: "create",
    entityId,
    projectId: pot.projectId,
    potId: pot.id,
    payload: {
      amount: data.amount,
      description: data.description,
      from: data.from,
      to: data.to,
    },
  });

  return entityId;
}

export async function deleteSpendingOffline(spending: Spending): Promise<void> {
  const online = await isActuallyOnline();

  // Note: No server delete action exists currently for spending
  if (online) {
    console.warn("Spending delete not supported on server yet");
  }

  const now = Date.now();
  const existing = await db.spendings.get(spending.id);

  if (existing) {
    await db.spendings.update(spending.id, {
      _deleted: true,
      _syncStatus: "pending",
      _lastModified: now,
    });
  }

  await syncManager.enqueue({
    entityType: "spending",
    operation: "delete",
    entityId: spending.id,
    projectId: spending.projectId,
    potId: spending.potId ?? undefined,
    payload: {},
  });
}
