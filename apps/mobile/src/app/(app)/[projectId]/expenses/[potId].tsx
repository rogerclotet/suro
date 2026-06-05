import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Avatar } from "@/components/avatar";
import { headerCreateAction } from "@/components/header-badges";
import { useLocale, useTranslations } from "@/i18n";
import { useTimeAgo } from "@/lib/datetime";
import { formatMoney, parseMoney } from "@/lib/money";
import { useTheme } from "@/theme";
import { Button, Fab, Field, Loading, Screen, Sheet, Txt } from "@/ui";

type Pot = NonNullable<FunctionReturnType<typeof api.expenses.getPot>>;
type Member = Pot["members"][number];
type LoadedMember = Member & { _id: Id<"users"> };
type Spending = Pot["spendings"][number];

const OWES_COLOR = "#e64553";
const BAR_WIDTH = 150;
const HOUR_MS = 60 * 60_000;
const WEEK_MS = 7 * 24 * HOUR_MS;

function loadedMembers(members: Member[]): LoadedMember[] {
  return members.filter((m): m is LoadedMember => m._id !== null);
}

/**
 * Relative time pinned with an absolute timestamp for the hour/day range —
 * mirrors the web app's spending line ("fa 4 dies (10:42 del 31 de maig…)").
 * Reuses `useTimeAgo` for the relative part because iOS Hermes ships no
 * `Intl.RelativeTimeFormat`.
 */
function useSpendingWhen(): (epochMs: number) => string {
  const timeAgo = useTimeAgo();
  const locale = useLocale();
  const te = useTranslations("expenses");
  return (epochMs) => {
    const relative = timeAgo(epochMs);
    const diff = Date.now() - epochMs;
    // Minutes are unambiguous and week-plus already resolves to a date, so the
    // absolute timestamp only adds value in between.
    if (diff < HOUR_MS || diff >= WEEK_MS) {
      return relative;
    }
    const date = new Date(epochMs);
    const time = date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const isToday = date.toDateString() === new Date().toDateString();
    const stamp = isToday
      ? te("spendingTimestampToday", { time })
      : te("spendingTimestampDate", {
          time,
          date: date.toLocaleDateString(locale, {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        });
    return `${relative} (${stamp})`;
  };
}

/**
 * A member's balance as a two-sided bar, like the web app: debtors fill red to
 * the left of centre, creditors green to the right, each proportional to the
 * largest absolute balance in the pot, with the signed amount in a pill.
 */
function BalanceBar({ amount, maxAbs }: { amount: number; maxAbs: number }) {
  const t = useTheme();
  const percent = maxAbs === 0 ? 0 : Math.abs(amount) / maxAbs;
  const positive = Math.round(amount) >= 0;
  const fill = `${percent * 50}%` as const;
  return (
    <View
      style={{
        width: BAR_WIDTH,
        height: 34,
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: t.inputBg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {percent > 0 ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: fill,
            backgroundColor: positive ? t.primary : OWES_COLOR,
            ...(positive ? { left: "50%" } : { right: "50%" }),
          }}
        />
      ) : null}
      <View
        style={{
          backgroundColor: t.text,
          borderRadius: 999,
          paddingHorizontal: 8,
          paddingVertical: 2,
        }}
      >
        <Txt size={13} weight="700" style={{ color: t.bg }}>
          {formatMoney(maxAbs === 0 ? 0 : amount)}
        </Txt>
      </View>
    </View>
  );
}

/**
 * One spending rendered as a sentence ("**Bob** paid **30€** for Dinner …"),
 * mirroring the web app's bulleted transaction log.
 */
function SpendingLine({ spending }: { spending: Spending }) {
  const tc = useTranslations("mobile.common");
  const te = useTranslations("expenses");
  const when = useSpendingWhen();
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <Txt muted style={{ lineHeight: 21 }}>
        {"•"}
      </Txt>
      <Txt muted size={14} style={{ flex: 1, lineHeight: 21 }}>
        <Txt size={14} weight="700">
          {spending.fromName ?? tc("someone")}
        </Txt>{" "}
        {te("spendingPaid")}{" "}
        <Txt size={14} weight="700">
          {formatMoney(spending.amount, spending.currency)}
        </Txt>
        {spending.to ? (
          <>
            {" "}
            {te("spendingTo")}{" "}
            <Txt size={14} weight="700">
              {spending.toName ?? tc("someone")}
            </Txt>
          </>
        ) : null}
        {spending.description ? (
          <>
            {" "}
            {te("spendingFor")} <Txt size={14}>{spending.description}</Txt>
          </>
        ) : null}{" "}
        {when(spending._creationTime)}
      </Txt>
    </View>
  );
}

export default function PotDetail() {
  const { potId } = useLocalSearchParams<{ potId: string }>();
  const id = potId as Id<"pots">;
  const pot = useQuery(api.expenses.getPot, { potId: id });
  const t = useTheme();
  const tExp = useTranslations("mobile.expenses");
  const tc = useTranslations("mobile.common");
  const timeAgo = useTimeAgo();
  const [adding, setAdding] = useState(false);
  const [settling, setSettling] = useState(false);

  if (pot === undefined) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  const maxAbs = Math.max(
    0,
    ...pot.balances.map((entry) => Math.abs(entry.amount)),
  );

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: pot.name,
          ...headerCreateAction({
            onPress: () => setAdding(true),
            label: tExp("newSpending"),
          }),
        }}
      />
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
            {tExp("settledAgo", { time: timeAgo(pot.settledAt) })}
          </Txt>
        ) : null}

        {/* Two-sided balance bars: red left for debtors, green right for
            creditors, each scaled to the pot's largest absolute balance. */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingBottom: 6,
            borderBottomWidth: 1,
            borderBottomColor: t.border,
          }}
        >
          <Txt muted size={12} style={{ flex: 1, letterSpacing: 1 }}>
            {tc("member")}
          </Txt>
          <Txt muted size={12} style={{ letterSpacing: 1 }}>
            {tExp("balances")}
          </Txt>
        </View>
        {pot.balances.map((entry, index) => (
          <View
            key={entry.user._id ?? entry.user.name}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingVertical: 10,
              borderBottomWidth: index < pot.balances.length - 1 ? 1 : 0,
              borderBottomColor: t.border,
            }}
          >
            <Avatar
              name={entry.user.name}
              image={entry.user.image}
              color={entry.user.avatarColor}
              size={28}
            />
            <Txt style={{ flex: 1 }} numberOfLines={1}>
              {entry.user.name ?? tc("member")}
            </Txt>
            <BalanceBar amount={entry.amount} maxAbs={maxAbs} />
          </View>
        ))}

        {pot.settlements.length > 0 ? (
          <Button
            title={tExp("settleUp")}
            variant="ghost"
            onPress={() => setSettling(true)}
          />
        ) : null}

        <Txt
          muted
          size={12}
          style={{ letterSpacing: 1, marginTop: 20, marginBottom: 8 }}
        >
          {tExp("spendings")}
        </Txt>
        {pot.spendings.length === 0 ? (
          <Txt muted style={{ fontStyle: "italic", paddingVertical: 8 }}>
            {tExp("noSpendings")}
          </Txt>
        ) : (
          <View style={{ gap: 10 }}>
            {pot.spendings.map((spending) => (
              <SpendingLine key={spending._id} spending={spending} />
            ))}
          </View>
        )}
      </ScrollView>

      <Fab onPress={() => setAdding(true)} label={tExp("newSpending")} />
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
  const tc = useTranslations("mobile.common");
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
        {member ? (member.name ?? tc("member")) : label}
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
  const tExp = useTranslations("mobile.expenses");

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
          {tExp("newSpending")}
        </Txt>
        <Field
          placeholder={tExp("amountPlaceholder")}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          autoFocus
        />
        <Field
          placeholder={tExp("descriptionPlaceholder")}
          value={description}
          onChangeText={setDescription}
        />

        <Txt muted size={13}>
          {tExp("paidBy")}
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
          {tExp("forLabel")}
        </Txt>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <MemberChip
            label={tExp("everyoneSplit")}
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
          title={busy ? tExp("adding") : tExp("addSpending")}
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
  const tExp = useTranslations("mobile.expenses");
  const tc = useTranslations("mobile.common");
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
        {tExp("settleUp")}
      </Txt>
      {pot.settlements.length === 0 ? (
        <Txt muted>{tExp("everyoneSettled")}</Txt>
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
                    {payment.fromName ?? tc("someone")} →{" "}
                    {payment.toName ?? tc("someone")}
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
            title={
              busy
                ? tExp("settling")
                : tExp("recordPayments", { count: selectedCount })
            }
            disabled={busy || selectedCount === 0}
            onPress={submit}
          />
        </>
      )}
    </Sheet>
  );
}
