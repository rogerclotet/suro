import { Gift } from "lucide-react-native";
import { View } from "react-native";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Button, Card, Txt } from "@/ui";

/**
 * What a Secret Santa is and how one runs, with the create action when the
 * group is big enough for a draw.
 */
export function SecretSantaIntro({
  onCreate,
}: {
  /** Absent when the group has fewer than two members. */
  onCreate?: () => void;
}) {
  const t = useTheme();
  const tSanta = useTranslations("secretSanta");
  const steps = [
    tSanta("emptyStepDetails"),
    tSanta("emptyStepIdeas"),
    tSanta("emptyStepDraw"),
  ];
  return (
    <View style={{ gap: 20 }}>
      <View style={{ alignItems: "center", gap: 12, paddingTop: 8 }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: t.navBar,
          }}
        >
          <Gift color={t.primary} size={44} />
        </View>
        <Txt size={20} weight="700" style={{ textAlign: "center" }}>
          {onCreate ? tSanta("emptyTitle") : tSanta("infoDescription")}
        </Txt>
        <Txt muted size={15} style={{ textAlign: "center" }}>
          {tSanta("description")}
        </Txt>
      </View>
      <Card>
        <View style={{ gap: 14 }}>
          <Txt size={16} weight="700" display>
            {tSanta("howItWorks")}
          </Txt>
          {steps.map((step, index) => (
            <View
              key={step}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: t.primary,
                }}
              >
                <Txt size={13} weight="700" style={{ color: t.onPrimary }}>
                  {String(index + 1)}
                </Txt>
              </View>
              <Txt size={15} style={{ flex: 1, paddingTop: 3 }}>
                {step}
              </Txt>
            </View>
          ))}
        </View>
      </Card>
      {onCreate ? (
        <Button title={tSanta("createAction")} onPress={onCreate} />
      ) : null}
    </View>
  );
}
