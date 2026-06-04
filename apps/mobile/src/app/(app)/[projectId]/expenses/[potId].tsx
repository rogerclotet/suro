import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Avatar } from "@/components/avatar";
import { formatMoney, parseMoney } from "@/lib/money";
import { timeAgo } from "@/lib/time-ago";
import { useTheme } from "@/theme";
import { Button, Card, Fab, Field, Loading, Screen, Sheet, Txt } from "@/ui";

type Pot = NonNullable<FunctionReturnType<typeof api.expenses.getPot>>;
type Member = Pot["members"][number];
type LoadedMember = Member & { _id: Id<"users"> };

const OWES_COLOR = "#e64553";

function loadedMembers(members: Member[]): LoadedMember[] {
  return members.filter((m): m is LoadedMember => m._id !== null);
}

export default function PotDetail() {
  const { potId } = useLocalSearchParams<{ potId: string }>();
  const id = potId as Id<"pots">;
  const pot = useQuery(api.expenses.getPot, { potId: id });
  const t = useTheme();
  const [adding, setAdding] = useState(false);
  const [settling, setSettling] = useState(false);

  if (pot === undefined) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: pot.name }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
        {pot.settledAt ? (
          <Txt
            size={13}
            weight="700"
            style={{
              alignSelf: "flex-start",
              color: t.muted,
              borderWidth: 1,
              borderColor: t.border,
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 2,
              marginBottom: 12,
            }}
          >
            Settled {timeAgo(pot.settledAt)}
          </Txt>
        ) : null}

        <Txt muted size={12} style={{ letterSpacing: 1, marginBottom: 8 }}>
          BALANCES
        </Txt>
        <View style={{ gap: 8 }}>
          {pot.balances.map((entry) => (
            <View
              key={entry.user._id ?? entry.user.name}
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Avatar
                name={entry.user.name}
                image={entry.user.image}
                color={entry.user.avatarColor}
                size={28}
              />
              <Txt style={{ flex: 1 }} numberOfLines={1}>
                {entry.user.name ?? "Member"}
              </Txt>
              <Txt
                weight="700"
                style={{
                  color:
                    entry.amount > 0
                      ? t.primary
                      : entry.amount < 0
                        ? OWES_COLOR
                        : t.muted,
                }}
              >
                {entry.amount > 0
                  ? `gets ${formatMoney(entry.amount)}`
                  : entry.amount < 0
                    ? `owes ${formatMoney(-entry.amount)}`
                    : "settled"}
              </Txt>
            </View>
          ))}
        </View>

        {pot.settlements.length > 0 ? (
          <Button
            title="Settle up"
            variant="ghost"
            onPress={() => setSettling(true)}
          />
        ) : null}

        <Txt
          muted
          size={12}
          style={{ letterSpacing: 1, marginTop: 20, marginBottom: 8 }}
        >
          SPENDINGS
        </Txt>
        {pot.spendings.length === 0 ? (
          <Txt muted style={{ fontStyle: "italic", paddingVertical: 8 }}>
            No spendings yet. Tap + to add one.
          </Txt>
        ) : (
          <View style={{ gap: 10 }}>
            {pot.spendings.map((spending) => (
              <Card key={spending._id}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Txt size={16} weight="700" style={{ flex: 1 }}>
                    {formatMoney(spending.amount, spending.currency)}
                  </Txt>
                  <Txt muted size={12}>
                    {timeAgo(spending._creationTime)}
                  </Txt>
                </View>
                <Txt muted size={13} style={{ marginTop: 2 }}>
                  {spending.fromName ?? "Someone"}
                  {spending.to
                    ? ` → ${spending.toName ?? "someone"}`
                    : " · split among all"}
                </Txt>
                {spending.description ? (
                  <Txt size={14} style={{ marginTop: 6 }}>
                    {spending.description}
                  </Txt>
                ) : null}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <Fab onPress={() => setAdding(true)} />
      <AddSpendingSheet
        visible={adding}
        pot={pot}
        onClose={() => setAdding(false)}
      />
      <SettleSheet
        visible={settling}
        pot={pot}
        onClose={() => setSettling(false)}
      />
    </Screen>
  );
}

function MemberChip({
  label,
  member,
  selected,
  onPress,
}: {
  label?: string;
  member?: LoadedMember;
  selected: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderWidth: 1,
        borderColor: selected ? t.primary : t.border,
        backgroundColor: selected ? t.inputBg : "transparent",
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 10,
      }}
    >
      {member ? (
        <Avatar
          name={member.name}
          image={member.image}
          color={member.avatarColor}
          size={20}
        />
      ) : null}
      <Txt size={14} style={{ color: selected ? t.primary : t.text }}>
        {member ? (member.name ?? "Member") : label}
      </Txt>
    </Pressable>
  );
}

function AddSpendingSheet({
  visible,
  pot,
  onClose,
}: {
  visible: boolean;
  pot: Pot;
  onClose: () => void;
}) {
  const me = useQuery(api.users.me);
  const createSpending = useMutation(api.expenses.createSpending);
  const members = useMemo(() => loadedMembers(pot.members), [pot.members]);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [fromOverride, setFromOverride] = useState<Id<"users"> | null>(null);
  // `to === null` means split equally among everyone.
  const [to, setTo] = useState<Id<"users"> | null>(null);
  const [busy, setBusy] = useState(false);

  const defaultPayer =
    me && members.some((m) => m._id === me._id)
      ? me._id
      : (members[0]?._id ?? null);
  const from = fromOverride ?? defaultPayer;
  const cents = parseMoney(amount);
  const valid = cents !== null && from !== null && to !== from;

  async function submit() {
    if (!valid || from === null || cents === null) {
      return;
    }
    setBusy(true);
    try {
      await createSpending({
        potId: pot._id,
        amount: cents,
        description: description.trim() || undefined,
        from,
        to: to ?? undefined,
      });
      setAmount("");
      setDescription("");
      setFromOverride(null);
      setTo(null);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        <Txt size={18} weight="700">
          New spending
        </Txt>
        <Field
          placeholder="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          autoFocus
        />
        <Field
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
        />

        <Txt muted size={13}>
          Paid by
        </Txt>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {members.map((member) => (
            <MemberChip
              key={member._id}
              member={member}
              selected={from === member._id}
              onPress={() => setFromOverride(member._id)}
            />
          ))}
        </View>

        <Txt muted size={13}>
          For
        </Txt>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <MemberChip
            label="Everyone (split)"
            selected={to === null}
            onPress={() => setTo(null)}
          />
          {members
            .filter((member) => member._id !== from)
            .map((member) => (
              <MemberChip
                key={member._id}
                member={member}
                selected={to === member._id}
                onPress={() => setTo(member._id)}
              />
            ))}
        </View>

        <Button
          title={busy ? "Adding…" : "Add spending"}
          disabled={busy || !valid}
          onPress={submit}
        />
      </ScrollView>
    </Sheet>
  );
}

function SettleSheet({
  visible,
  pot,
  onClose,
}: {
  visible: boolean;
  pot: Pot;
  onClose: () => void;
}) {
  const settlePayments = useMutation(api.expenses.settlePayments);
  const t = useTheme();
  // All proposals selected by default; users can deselect any.
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  function toggle(index: number) {
    const next = new Set(excluded);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setExcluded(next);
  }

  async function submit() {
    const payments = pot.settlements
      .filter((_, index) => !excluded.has(index))
      .map((p) => ({ from: p.from, to: p.to, amount: p.amount }));
    if (payments.length === 0) {
      return;
    }
    setBusy(true);
    try {
      await settlePayments({ potId: pot._id, payments });
      setExcluded(new Set());
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const selectedCount = pot.settlements.length - excluded.size;

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        Settle up
      </Txt>
      {pot.settlements.length === 0 ? (
        <Txt muted>Everyone is settled up.</Txt>
      ) : (
        <>
          <ScrollView
            style={{ maxHeight: 320 }}
            contentContainerStyle={{ gap: 8 }}
          >
            {pot.settlements.map((payment, index) => {
              const on = !excluded.has(index);
              return (
                <Pressable
                  // biome-ignore lint/suspicious/noArrayIndexKey: proposals are a stable ordered list for this render
                  key={index}
                  onPress={() => toggle(index)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    borderWidth: 1,
                    borderColor: on ? t.primary : t.border,
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <Txt style={{ flex: 1 }}>
                    {payment.fromName ?? "Someone"} →{" "}
                    {payment.toName ?? "someone"}
                  </Txt>
                  <Txt weight="700">{formatMoney(payment.amount)}</Txt>
                  <Txt weight="700" style={{ color: on ? t.primary : t.muted }}>
                    {on ? "✓" : "○"}
                  </Txt>
                </Pressable>
              );
            })}
          </ScrollView>
          <Button
            title={busy ? "Settling…" : `Record ${selectedCount} payment(s)`}
            disabled={busy || selectedCount === 0}
            onPress={submit}
          />
        </>
      )}
    </Sheet>
  );
}
