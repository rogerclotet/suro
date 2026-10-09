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
import type { WidgetEventDate, WidgetSnapshot } from "./types";

const LOGO_SIZE = 22;
const WIDGET_LOGO = require("../../assets/images/favicon.png") as number;

const palette = {
  light: {
    bg: nativePalette.light.bg,
    text: nativePalette.light.text,
    muted: nativePalette.light.muted,
    primary: nativePalette.light.primary,
    onPrimary: nativePalette.light.onPrimary,
    border: nativePalette.light.border,
  },
  dark: {
    bg: nativePalette.dark.bg,
    text: nativePalette.dark.text,
    muted: nativePalette.dark.muted,
    primary: nativePalette.dark.primary,
    onPrimary: nativePalette.dark.onPrimary,
    border: nativePalette.dark.border,
  },
} as const;

type Scheme = keyof typeof palette;
type Colors = (typeof palette)[Scheme];

const BADGE_WIDTH = 44;

function appUri(path: string): string {
  return Linking.createURL(path.replace(/^\//, ""));
}

function widgetHeader(title: string, colors: Colors, homePath?: string) {
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

function sectionLabel(text: string, colors: Colors, marginTop = 0) {
  return (
    <TextWidget
      text={text.toUpperCase()}
      style={{
        marginTop,
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

function emptyLine(text: string, colors: Colors) {
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

// Rows are flat with a hairline between them, like the app's Home panels.
function rowStyle(colors: Colors, isFirst: boolean) {
  return {
    width: "match_parent",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: isFirst ? 0 : 1,
    borderTopColor: colors.border,
  } as const;
}

function eventDateBadge(
  date: WidgetEventDate,
  todayLabel: string,
  colors: Colors,
) {
  const badgeStyle = {
    width: BADGE_WIDTH,
    borderRadius: 8,
    paddingVertical: 6,
    marginRight: 12,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  } as const;

  if (date.isToday) {
    return (
      <FlexWidget style={{ ...badgeStyle, backgroundColor: colors.primary }}>
        <TextWidget
          text={todayLabel.toUpperCase()}
          maxLines={1}
          style={{
            fontSize: 10,
            fontWeight: "700",
            color: colors.onPrimary,
            letterSpacing: 0.5,
          }}
        />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget style={{ ...badgeStyle, backgroundColor: `${colors.muted}30` }}>
      <TextWidget
        text={String(date.day)}
        style={{
          fontSize: 18,
          fontFamily: FONT,
          fontWeight: "700",
          color: colors.text,
        }}
      />
      <TextWidget
        text={date.month.toUpperCase()}
        maxLines={1}
        style={{ fontSize: 10, color: colors.muted, letterSpacing: 0.5 }}
      />
    </FlexWidget>
  );
}

function eventRow(
  event: WidgetSnapshot["events"][number],
  todayLabel: string,
  colors: Colors,
  isFirst: boolean,
) {
  return (
    <FlexWidget
      key={event.id}
      clickAction="OPEN_URI"
      clickActionData={{ uri: appUri(event.path) }}
      style={rowStyle(colors, isFirst)}
    >
      {event.date ? eventDateBadge(event.date, todayLabel, colors) : null}
      <FlexWidget style={{ flex: 1, width: 0, flexDirection: "column" }}>
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
    </FlexWidget>
  );
}

function listRow(
  list: WidgetSnapshot["lists"][number],
  colors: Colors,
  isFirst: boolean,
) {
  const complete = list.total > 0 && list.done === list.total;
  return (
    <FlexWidget
      key={list.id}
      clickAction="OPEN_URI"
      clickActionData={{ uri: appUri(list.path) }}
      style={rowStyle(colors, isFirst)}
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
          : snapshot.lists.map((list, index) =>
              listRow(list, colors, index === 0),
            )}

        {sectionLabel(snapshot.labels.upcoming, colors, 12)}
        {snapshot.events.length === 0
          ? emptyLine(snapshot.labels.noEvents, colors)
          : snapshot.events.map((event, index) =>
              eventRow(event, snapshot.labels.today, colors, index === 0),
            )}
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
