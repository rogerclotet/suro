import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useEffect, useMemo, useState } from "react";
import { Dimensions, ScrollView, View } from "react-native";
import SoloMonthChart from "@/components/solo-month-chart";
import { useLocale, useTranslations } from "@/i18n";
import { useTimeAgo } from "@/lib/datetime";
import {
  monthDailyAmounts,
  monthSpendingTotal,
} from "@/lib/expenses/month-totals";
import { formatMoney, parseMoney } from "@/lib/money";
import { useOfflineSoloExpenses, useQueuedMutation } from "@/lib/offline";
import { useTheme } from "@/theme";
import {
  Button,
  Card,
  Fab,
  Field,
  Loading,
  Sheet,
  Txt,
  useFabScroll,
} from "@/ui";

const SCREEN_HEIGHT = Dimensions.get("window").height;

type SoloExpenses = NonNullable<
  FunctionReturnType<typeof api.expenses.getSoloExpenses>
>;
type SoloSpending = SoloExpenses["spendings"][number];

function MonthCardHeading({
  period,
  month,
}: {
  period: string;
  month: string;
}) {
  return (
    <View style={{ gap: 2 }}>
      <Txt muted size={11}>
        {period}
      </Txt>
      <Txt size={13} weight="700">
        {month}
      </Txt>
    </View>
  );
}

function SoloSpendingLine({ spending }: { spending: SoloSpending }) {
  const tExp = useTranslations("mobile.expenses");
  const timeAgo = useTimeAgo();
  const createdAt = spending.createdAt ?? spending._creationTime;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        paddingVertical: 12,
      }}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Txt size={15} weight="700" numberOfLines={2}>
          {spending.description?.trim()
            ? spending.description
            : tExp("soloUntitledSpending")}
        </Txt>
        <Txt muted size={13}>
          {timeAgo(createdAt)}
        </Txt>
      </View>
      <Txt size={15} weight="700">
        {formatMoney(spending.amount, spending.currency)}
      </Txt>
    </View>
  );
}

function AddSoloSpendingSheet({
  visible,
  potId,
  memberId,
  onClose,
}: {
  visible: boolean;
  potId: Id<"pots">;
  memberId: Id<"users">;
  onClose: () => void;
}) {
  const createSpending = useQueuedMutation(api.expenses.createSpending);
  const tExp = useTranslations("mobile.expenses");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const cents = parseMoney(amount);
  const valid = cents !== null;

  async function submit() {
    if (!valid || cents === null) {
      return;
    }
    setBusy(true);
    try {
      await createSpending({
        potId,
        amount: cents,
        description: description.trim() || undefined,
        from: memberId,
      });
      setAmount("");
      setDescription("");
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollView
        style={{ maxHeight: SCREEN_HEIGHT * 0.72 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 12 }}
      >
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
        <Button
          title={busy ? tExp("adding") : tExp("addSpending")}
          disabled={busy || !valid}
          onPress={submit}
        />
      </ScrollView>
    </Sheet>
  );
}

export default function SoloExpensesView({
  projectId,
}: {
  projectId: Id<"projects">;
}) {
  const solo = useOfflineSoloExpenses(projectId);
  const ensureSoloPot = useMutation(api.expenses.ensureSoloPot);
  const locale = useLocale();
  const tExp = useTranslations("mobile.expenses");
  const t = useTheme();
  const fab = useFabScroll();
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    void ensureSoloPot({ projectId });
  }, [ensureSoloPot, projectId]);

  const spendings = useMemo(
    () =>
      (solo?.spendings ?? []).map((spending) => ({
        amount: spending.amount,
        createdAt: spending.createdAt ?? spending._creationTime,
      })),
    [solo?.spendings],
  );

  const thisMonthTotal = useMemo(
    () => monthSpendingTotal(spendings, 0),
    [spendings],
  );
  const lastMonthTotal = useMemo(
    () => monthSpendingTotal(spendings, -1),
    [spendings],
  );
  const thisMonthDaily = useMemo(
    () => monthDailyAmounts(spendings, 0),
    [spendings],
  );
  const lastMonthDaily = useMemo(
    () => monthDailyAmounts(spendings, -1),
    [spendings],
  );

  const thisMonthLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(locale, { month: "long", year: "numeric" });
  }, [locale]);

  const lastMonthLabel = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
  }, [locale]);

  if (solo === undefined) {
    return <Loading />;
  }
  if (solo === null) {
    return null;
  }

  const potId = solo.potId;
  const memberId = solo.memberId;

  return (
    <>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 96 }}
        onScroll={fab.onScroll}
        scrollEventThrottle={16}
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Card>
              <View style={{ gap: 8 }}>
                <MonthCardHeading
                  period={tExp("soloThisMonth")}
                  month={thisMonthLabel}
                />
                <Txt size={28} weight="700">
                  {formatMoney(thisMonthTotal)}
                </Txt>
              </View>
            </Card>
          </View>
          <View style={{ flex: 1 }}>
            <Card>
              <View style={{ gap: 8 }}>
                <MonthCardHeading
                  period={tExp("soloLastMonth")}
                  month={lastMonthLabel}
                />
                <Txt size={28} weight="700">
                  {formatMoney(lastMonthTotal)}
                </Txt>
              </View>
            </Card>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Card>
              <View style={{ gap: 8 }}>
                <MonthCardHeading
                  period={tExp("soloThisMonth")}
                  month={thisMonthLabel}
                />
                <SoloMonthChart
                  amounts={thisMonthDaily}
                  color={t.primary}
                  borderColor={t.border}
                />
              </View>
            </Card>
          </View>
          <View style={{ flex: 1 }}>
            <Card>
              <View style={{ gap: 8 }}>
                <MonthCardHeading
                  period={tExp("soloLastMonth")}
                  month={lastMonthLabel}
                />
                <SoloMonthChart
                  amounts={lastMonthDaily}
                  color={t.primary}
                  borderColor={t.border}
                />
              </View>
            </Card>
          </View>
        </View>

        <Txt size={17} weight="700">
          {tExp("soloRecentSpendings")}
        </Txt>

        {spendings.length === 0 ? (
          <Txt muted style={{ textAlign: "center", paddingVertical: 24 }}>
            {tExp("soloNoSpendings")}
          </Txt>
        ) : (
          <View>
            {(solo?.spendings ?? []).map((spending, index) => (
              <View
                key={spending._id}
                style={
                  index < (solo?.spendings.length ?? 0) - 1
                    ? { borderBottomWidth: 1, borderBottomColor: t.border }
                    : undefined
                }
              >
                <SoloSpendingLine spending={spending} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {potId !== null ? (
        <>
          <Fab
            onPress={() => setAdding(true)}
            label={tExp("newSpending")}
            extended={fab.extended}
          />
          <AddSoloSpendingSheet
            visible={adding}
            potId={potId}
            memberId={memberId}
            onClose={() => setAdding(false)}
          />
        </>
      ) : null}
    </>
  );
}
