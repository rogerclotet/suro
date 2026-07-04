import { ChevronDown, ChevronUp } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useTheme } from "@/theme";
import { Txt } from "@/ui";

/** An hour:minute pair, in 24h local time. */
export type Time = { hour: number; minute: number };

export function timeOf(ms: number): Time {
  const d = new Date(ms);
  return { hour: d.getHours(), minute: d.getMinutes() };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Hour:minute stepper used by the event form and the task due-date editor. Hours
 * wrap 0–23, minutes step by 5 and wrap 0–55, so it composes inline next to a
 * date row without opening a native picker.
 */
export function TimeStepper({
  value,
  onChange,
}: {
  value: Time;
  onChange: (value: Time) => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Stepper
        value={value.hour}
        onChange={(hour) => onChange({ ...value, hour: (hour + 24) % 24 })}
      />
      <Txt size={18} weight="700">
        :
      </Txt>
      <Stepper
        value={value.minute}
        step={5}
        onChange={(minute) =>
          onChange({ ...value, minute: (minute + 60) % 60 })
        }
      />
    </View>
  );
}

function Stepper({
  value,
  step = 1,
  onChange,
}: {
  value: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ alignItems: "center" }}>
      <Pressable
        onPress={() => onChange(value + step)}
        hitSlop={6}
        style={{ padding: 2 }}
      >
        <ChevronUp color={t.primary} size={20} />
      </Pressable>
      <Txt size={18} weight="700" style={{ minWidth: 28, textAlign: "center" }}>
        {pad(value)}
      </Txt>
      <Pressable
        onPress={() => onChange(value - step)}
        hitSlop={6}
        style={{ padding: 2 }}
      >
        <ChevronDown color={t.primary} size={20} />
      </Pressable>
    </View>
  );
}
