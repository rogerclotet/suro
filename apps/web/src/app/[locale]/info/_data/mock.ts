import type { Spending } from "@/app/_data/spending";
import type { InfoKey } from "@/i18n/message-keys";

export type DemoMember = {
  id: string;
  name: string;
  image: null;
  customImage: null;
  avatarColor: "red" | "peach" | "yellow" | "teal" | "blue" | "mauve";
};

export type DemoListItem = {
  id: string;
  name: string;
  completed: boolean;
  categoryId: string;
};

export type DemoListCategory = {
  id: string;
  name: string;
};

export type DemoFile = {
  id: string;
  name: InfoKey;
  type: string;
  size: number;
  uploadedByName: string;
};

export const demoMembers: DemoMember[] = [
  {
    id: "u-marta",
    name: "Marta",
    image: null,
    customImage: null,
    avatarColor: "peach",
  },
  {
    id: "u-joan",
    name: "Joan",
    image: null,
    customImage: null,
    avatarColor: "teal",
  },
  {
    id: "u-laia",
    name: "Laia",
    image: null,
    customImage: null,
    avatarColor: "mauve",
  },
  {
    id: "u-pau",
    name: "Pau",
    image: null,
    customImage: null,
    avatarColor: "blue",
  },
];

export const demoSpendingMembers = demoMembers.map((u) => ({ user: u }));

// Each demo spending has `to: null` so the app's settlement algorithm splits
// the cost across all members (matches the shared-spending branch in
// calculateBalances).
export type DemoSpendingInput = {
  id: string;
  amount: number;
  currency: string;
  description: string;
  payer: DemoMember;
};

export function buildDemoSpendings(inputs: DemoSpendingInput[]): Spending[] {
  return inputs.map(
    ({ id, amount, currency, description, payer }) =>
      ({
        id,
        amount,
        currency,
        description,
        from: payer,
        to: null,
      }) as unknown as Spending,
  );
}

export const demoFileKeys: DemoFile[] = [
  {
    id: "f-1",
    name: "demoFilesFileLease",
    type: "application/pdf",
    size: 482_300,
    uploadedByName: "Marta",
  },
  {
    id: "f-2",
    name: "demoFilesFileWifi",
    type: "image/jpeg",
    size: 218_000,
    uploadedByName: "Joan",
  },
  {
    id: "f-3",
    name: "demoFilesFileBoiler",
    type: "application/pdf",
    size: 1_240_000,
    uploadedByName: "Laia",
  },
];
