import { Gift } from "lucide-react-native";
import { View } from "react-native";
import { useTranslations } from "@/i18n";
import { useTheme } from "@/theme";
import { Button, Txt } from "@/ui";
import { Divider, SectionLabel } from "./layout";

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
    <View style={{ gap: 24 }}>
      <View style={{ alignItems: "center", gap: 12, paddingTop: 16 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${t.primary}1a`,
          }}
        >
          <Gift color={t.primary} size={34} />
        </View>
        <Txt size={20} weight="700" style={{ textAlign: "center" }}>
          {onCreate ? tSanta("emptyTitle") : tSanta("infoDescription")}
        </Txt>
        <Txt muted size={15} style={{ textAlign: "center" }}>
          {tSanta("description")}
        </Txt>
      </View>
      <Divider hairline />
      <View style={{ gap: 14 }}>
        <SectionLabel title={tSanta("howItWorks")} />
        {steps.map((step, index) => (
          <View
            key={step}
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}
          >
            <Txt
              size={15}
              weight="700"
              style={{ color: t.primary, width: 16, textAlign: "center" }}
            >
              {String(index + 1)}
            </Txt>
            <Txt size={15} style={{ flex: 1 }}>
              {step}
            </Txt>
          </View>
        ))}
      </View>
      {onCreate ? (
        <Button title={tSanta("createAction")} onPress={onCreate} />
      ) : null}
    </View>
  );
}
