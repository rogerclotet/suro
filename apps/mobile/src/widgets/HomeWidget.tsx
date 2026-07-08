import * as Linking from "expo-linking";
import type React from "react";
import {
  FlexWidget,
  ImageWidget,
  TextWidget,
  type WidgetRepresentation,
} from "react-native-android-widget";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { unconfiguredWidgetSnapshot } from "./placeholders";
import type { WidgetSnapshot } from "./types";

const FONT = "Convergence_400Regular";
const LOGO_SIZE = 22;
const WIDGET_LOGO =
  require("../../assets/images/notification-icon.png") as number;

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

function widgetHeader(
  title: string,
  colors: (typeof palette)[Scheme],
  homePath?: string,
) {
  return (
    <FlexWidget
      clickAction={homePath ? "OPEN_URI" : undefined}
      clickActionData={homePath ? { uri: appUri(homePath) } : undefined}
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <ImageWidget
        image={WIDGET_LOGO}
        imageWidth={LOGO_SIZE}
        imageHeight={LOGO_SIZE}
        radius={5}
      />
      <TextWidget
        text={title}
        maxLines={1}
        truncate="END"
        style={{
          marginLeft: 8,
          fontSize: 16,
          fontFamily: FONT,
          fontWeight: "700",
          color: colors.text,
        }}
      />
    </FlexWidget>
  );
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
        {widgetHeader("Suro", colors)}
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

  if (!snapshot.projectId) {
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
        {widgetHeader("Suro", colors)}
        <TextWidget
          text={snapshot.labels.configurePrompt}
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

  const title = snapshot.projectName ?? snapshot.labels.noGroup;

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: colors.bg,
        padding: 14,
        flexDirection: "column",
      }}
    >
      {widgetHeader(title, colors, snapshot.homePath)}

      {sectionLabel(snapshot.labels.upcoming, colors)}
      {snapshot.events.length === 0
        ? emptyLine(snapshot.labels.noEvents, colors)
        : snapshot.events.map((event) => eventRow(event, colors))}

      {sectionLabel(snapshot.labels.myTasks, colors)}
      {snapshot.tasks.length === 0
        ? emptyLine(snapshot.labels.noTasks, colors)
        : snapshot.tasks.map((task) => taskRow(task, colors))}
    </FlexWidget>
  );
}

export function renderHomeWidget(
  snapshot: WidgetSnapshot,
): WidgetRepresentation {
  return {
    light: renderForScheme(snapshot, "light"),
    dark: renderForScheme(snapshot, "dark"),
  };
}

export function renderDefaultWidget(): WidgetRepresentation {
  return renderHomeWidget(unconfiguredWidgetSnapshot(DEFAULT_LOCALE));
}
