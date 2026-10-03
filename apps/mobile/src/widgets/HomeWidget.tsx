import { FONT_DISPLAY_NATIVE as FONT, nativePalette } from "design-tokens";
import * as Linking from "expo-linking";
import type React from "react";
import {
  FlexWidget,
  ImageWidget,
  ListWidget,
  TextWidget,
  type WidgetRepresentation,
} from "react-native-android-widget";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { unconfiguredWidgetSnapshot } from "./placeholders";
import type { WidgetSnapshot } from "./types";

const LOGO_SIZE = 22;
const WIDGET_LOGO = require("../../assets/images/favicon.png") as number;

const palette = {
  light: {
    bg: nativePalette.light.bg,
    card: nativePalette.light.card,
    text: nativePalette.light.text,
    muted: nativePalette.light.muted,
  },
  dark: {
    bg: nativePalette.dark.bg,
    card: nativePalette.dark.card,
    text: nativePalette.dark.text,
    muted: nativePalette.dark.muted,
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
          color: colors.muted,
        }}
      />
    </FlexWidget>
  );
}

function listRow(
  list: WidgetSnapshot["lists"][number],
  colors: (typeof palette)[Scheme],
) {
  const complete = list.total > 0 && list.done === list.total;
  return (
    <FlexWidget
      key={list.id}
      clickAction="OPEN_URI"
      clickActionData={{ uri: appUri(list.path) }}
      style={{
        backgroundColor: colors.card,
        borderRadius: 10,
        padding: 10,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <FlexWidget style={{ flex: 1, width: 0 }}>
        <TextWidget
          text={list.name}
          maxLines={1}
          truncate="END"
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: complete ? colors.muted : colors.text,
            marginRight: 8,
          }}
        />
      </FlexWidget>
      <TextWidget
        text={`${list.done}/${list.total}`}
        style={{ fontSize: 12, color: colors.muted }}
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
          padding: 14,
          flexDirection: "column",
        }}
      >
        {widgetHeader("Suro", colors)}
        <TextWidget
          text={snapshot.labels.configurePrompt}
          style={{
            fontSize: 13,
            fontFamily: FONT,
            color: colors.muted,
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

      <ListWidget>
        {sectionLabel(snapshot.labels.featuredLists, colors)}
        {snapshot.lists.length === 0
          ? emptyLine(snapshot.labels.noLists, colors)
          : snapshot.lists.map((list) => listRow(list, colors))}

        {sectionLabel(snapshot.labels.upcoming, colors)}
        {snapshot.events.length === 0
          ? emptyLine(snapshot.labels.noEvents, colors)
          : snapshot.events.map((event) => eventRow(event, colors))}
      </ListWidget>
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
