import * as Linking from "expo-linking";
import type React from "react";
import {
  FlexWidget,
  TextWidget,
  type WidgetRepresentation,
} from "react-native-android-widget";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { widgetLabels } from "./labels";
import type { WidgetSnapshot } from "./types";

const FONT = "Convergence_400Regular";

const palette = {
  light: {
    bg: "#f6f2ea",
    card: "#ffffff",
    text: "#1e1e2e",
    muted: "#6c6f85",
    danger: "#e64553",
  },
  dark: {
    bg: "#211a16",
    card: "#19120e",
    text: "#ebe6de",
    muted: "#a0968f",
    danger: "#eba0ac",
  },
} as const;

type Scheme = keyof typeof palette;

function appUri(path: string): string {
  return Linking.createURL(path.replace(/^\//, ""));
}

function sectionLabel(text: string, colors: (typeof palette)[Scheme]) {
  return (
    <TextWidget
      text={text.toUpperCase()}
      style={{
        fontSize: 11,
        fontFamily: FONT,
        fontWeight: "700",
        color: colors.muted,
        letterSpacing: 0.8,
        marginBottom: 6,
      }}
    />
  );
}

function emptyLine(text: string, colors: (typeof palette)[Scheme]) {
  return (
    <TextWidget
      text={text}
      style={{
        fontSize: 13,
        fontFamily: FONT,
        color: colors.muted,
        marginBottom: 8,
      }}
    />
  );
}

function eventRow(
  event: WidgetSnapshot["events"][number],
  colors: (typeof palette)[Scheme],
) {
  return (
    <FlexWidget
      key={event.id}
      clickAction="OPEN_URI"
      clickActionData={{ uri: appUri(event.path) }}
      style={{
        backgroundColor: colors.card,
        borderRadius: 10,
        padding: 10,
        marginBottom: 8,
        flexDirection: "column",
      }}
    >
      <TextWidget
        text={event.name}
        maxLines={1}
        truncate="END"
        style={{
          fontSize: 14,
          fontFamily: FONT,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 2,
        }}
      />
      <TextWidget
        text={event.when}
        maxLines={1}
        truncate="END"
        style={{
          fontSize: 12,
          fontFamily: FONT,
          color: colors.muted,
        }}
      />
    </FlexWidget>
  );
}

function taskRow(
  task: WidgetSnapshot["tasks"][number],
  colors: (typeof palette)[Scheme],
) {
  const subtitle = task.dueLabel
    ? `${task.listName} · ${task.dueLabel}`
    : task.listName;
  return (
    <FlexWidget
      key={task.id}
      clickAction="OPEN_URI"
      clickActionData={{ uri: appUri(task.path) }}
      style={{
        backgroundColor: colors.card,
        borderRadius: 10,
        padding: 10,
        marginBottom: 8,
        flexDirection: "column",
      }}
    >
      <TextWidget
        text={task.name}
        maxLines={1}
        truncate="END"
        style={{
          fontSize: 14,
          fontFamily: FONT,
          color: colors.text,
          marginBottom: 2,
        }}
      />
      <TextWidget
        text={subtitle}
        maxLines={1}
        truncate="END"
        style={{
          fontSize: 12,
          fontFamily: FONT,
          color: task.overdue ? colors.danger : colors.muted,
        }}
      />
    </FlexWidget>
  );
}

function renderForScheme(
  snapshot: WidgetSnapshot,
  scheme: Scheme,
): React.JSX.Element {
  const colors = palette[scheme];
  const title =
    snapshot.projectName ??
    (snapshot.signedIn ? snapshot.labels.noGroup : "Suro");

  if (!snapshot.signedIn) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          height: "match_parent",
          width: "match_parent",
          backgroundColor: colors.bg,
          padding: 16,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TextWidget
          text="Suro"
          style={{
            fontSize: 18,
            fontFamily: FONT,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 8,
          }}
        />
        <TextWidget
          text={snapshot.labels.signIn}
          style={{
            fontSize: 13,
            fontFamily: FONT,
            color: colors.muted,
            textAlign: "center",
          }}
        />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      clickAction={snapshot.homePath ? "OPEN_URI" : "OPEN_APP"}
      clickActionData={
        snapshot.homePath ? { uri: appUri(snapshot.homePath) } : undefined
      }
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: colors.bg,
        padding: 14,
        flexDirection: "column",
      }}
    >
      <TextWidget
        text={title}
        maxLines={1}
        truncate="END"
        style={{
          fontSize: 16,
          fontFamily: FONT,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 12,
        }}
      />

      {sectionLabel(snapshot.labels.upcoming, colors)}
      {snapshot.events.length === 0
        ? emptyLine(
            snapshot.projectId
              ? snapshot.labels.noEvents
              : snapshot.labels.noGroup,
            colors,
          )
        : snapshot.events.map((event) => eventRow(event, colors))}

      {sectionLabel(snapshot.labels.myTasks, colors)}
      {snapshot.tasks.length === 0
        ? emptyLine(
            snapshot.projectId
              ? snapshot.labels.noTasks
              : snapshot.labels.noGroup,
            colors,
          )
        : snapshot.tasks.map((task) => taskRow(task, colors))}
    </FlexWidget>
  );
}

export function renderHomeWidget(
  snapshot: WidgetSnapshot | null,
): WidgetRepresentation {
  const data = snapshot ?? {
    updatedAt: Date.now(),
    locale: DEFAULT_LOCALE,
    signedIn: false,
    labels: widgetLabels(DEFAULT_LOCALE),
    events: [],
    tasks: [],
  };

  return {
    light: renderForScheme(data, "light"),
    dark: renderForScheme(data, "dark"),
  };
}
