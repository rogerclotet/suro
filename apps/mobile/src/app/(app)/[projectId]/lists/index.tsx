import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Stack, useRouter } from "expo-router";
import { Check, ChevronRight, LayoutTemplate } from "lucide-react-native";
import { type ReactNode, useMemo, useState } from "react";
import { Pressable, ScrollView, SectionList, Switch, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { sectionHeaderBadges } from "@/components/header-badges";
import { useTranslations } from "@/i18n";
import { useProjectId } from "@/lib/project-id";
import { useTheme } from "@/theme";
import { Button, Fab, Field, Loading, Screen, Sheet, Txt } from "@/ui";

type ListsResult = FunctionReturnType<typeof api.lists.listByProject>;
type ListWithItems = ListsResult[number];

function isCompleted(list: ListWithItems) {
  return list.items.length > 0 && list.items.every((item) => item.completed);
}

export default function ListsOverview() {
  const pid = useProjectId();
  const lists = useQuery(api.lists.listByProject, { projectId: pid });
  const router = useRouter();
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  const [creating, setCreating] = useState(false);

  const sections = useMemo(() => {
    if (!lists) {
      return [];
    }
    return [
      { title: tl("sectionFavorites"), data: lists.filter((l) => l.favorite) },
      {
        title: tl("sectionLists"),
        data: lists.filter((l) => !l.favorite && !isCompleted(l)),
      },
      {
        title: tl("sectionCompleted"),
        data: lists.filter((l) => !l.favorite && isCompleted(l)),
      },
    ].filter((section) => section.data.length > 0);
  }, [lists, tl]);

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: tl("title"),
          ...sectionHeaderBadges("lists", {
            onPress: () => setCreating(true),
            label: tl("newList"),
          }),
        }}
      />
      {lists === undefined ? (
        <Loading />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 96 }}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            <View style={{ marginHorizontal: 16 }}>
              <NavButton
                icon={<LayoutTemplate color={t.primary} size={18} />}
                label={tl("templates")}
                onPress={() => router.push(`/${pid}/lists/templates`)}
              />
            </View>
          }
          ListEmptyComponent={
            <Txt muted style={{ paddingVertical: 24, textAlign: "center" }}>
              {tl("empty")}
            </Txt>
          }
          renderSectionHeader={({ section }) => (
            <Txt
              muted
              size={12}
              style={{
                paddingTop: 16,
                paddingBottom: 4,
                paddingHorizontal: 16,
                letterSpacing: 1,
              }}
            >
              {section.title.toUpperCase()}
            </Txt>
          )}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                marginHorizontal: 16,
                backgroundColor: t.border,
              }}
            />
          )}
          renderItem={({ item }) => {
            const total = item.items.length;
            const done = item.items.filter((i) => i.completed).length;
            const pending = total - done;
            return (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: `/${pid}/lists/${item._id}`,
                    params: { name: item.name },
                  })
                }
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: pressed ? t.border : "transparent",
                })}
              >
                <View style={{ flex: 1 }}>
                  <Txt size={16}>{item.name}</Txt>
                  {item.description ? (
                    <Txt
                      muted
                      size={13}
                      numberOfLines={1}
                      style={{ marginTop: 2 }}
                    >
                      {item.description}
                    </Txt>
                  ) : null}
                </View>
                <ProgressRing done={done} pending={pending} total={total} />
              </Pressable>
            );
          }}
        />
      )}

      <Fab onPress={() => setCreating(true)} label={tl("newList")} />
      <CreateListSheet
        visible={creating}
        projectId={pid}
        onClose={() => setCreating(false)}
      />
    </Screen>
  );
}

// Per-row completion ring (Reminders/Things-style): an empty track for an
// empty list, a primary arc that fills as items complete, and a solid disc
// with a check when everything is done. One ring per row is what marks each
// row as a checklist of its own — the screen reads as a list of lists. The
// pending count sits inside the ring so an arc-less ring still reads as a
// progress gauge rather than an unchecked checkbox.
function ProgressRing({
  done,
  pending,
  total,
}: {
  done: number;
  pending: number;
  total: number;
}) {
  const t = useTheme();
  const size = 30;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const complete = total > 0 && done === total;

  if (complete) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: t.primary,
        }}
      >
        <Check color={t.onPrimary} size={16} strokeWidth={3} />
      </View>
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={t.border}
          strokeWidth={stroke}
          fill="none"
        />
        {done > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={t.primary}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={circumference * (1 - done / total)}
            // Start the arc at 12 o'clock instead of SVG's default 3 o'clock.
            rotation={-90}
            originX={size / 2}
            originY={size / 2}
          />
        ) : null}
      </Svg>
      {pending > 0 ? (
        // Two digits is all the ring fits; beyond that the gauge matters more
        // than the exact number.
        <Txt muted size={12} weight="700">
          {pending > 99 ? "99" : pending}
        </Txt>
      ) : null}
    </View>
  );
}

// A compact launcher row for a list subsection (templates). Deliberately
// distinct from the list rows below: bordered card, primary-tinted icon badge,
// and a trailing chevron that marks it as navigation rather than a list.
function NavButton({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: pressed ? t.border : t.card,
      })}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${t.primary}1a`,
        }}
      >
        {icon}
      </View>
      <Txt size={15} weight="700" style={{ flex: 1 }}>
        {label}
      </Txt>
      <ChevronRight color={t.muted} size={18} />
    </Pressable>
  );
}

function CreateListSheet({
  visible,
  projectId,
  onClose,
}: {
  visible: boolean;
  projectId: Id<"projects">;
  onClose: () => void;
}) {
  const templates = useQuery(api.templates.listByProject, { projectId });
  const createList = useMutation(api.lists.create);
  const router = useRouter();
  const t = useTheme();
  const tl = useTranslations("mobile.lists");
  const tc = useTranslations("mobile.common");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Id<"listTemplates">[]>([]);
  const [busy, setBusy] = useState(false);

  function toggleTemplate(id: Id<"listTemplates">) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function create() {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setBusy(true);
    try {
      const listId = await createList({
        projectId,
        name: trimmed,
        description: description.trim() || undefined,
        templateIds: selected.length > 0 ? selected : undefined,
      });
      setName("");
      setDescription("");
      setSelected([]);
      onClose();
      router.push({
        pathname: `/${projectId}/lists/${listId}`,
        params: { name: trimmed },
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        {tl("newList")}
      </Txt>
      <Field
        placeholder={tl("namePlaceholder")}
        value={name}
        onChangeText={setName}
        autoFocus
      />
      <Field
        placeholder={tl("descriptionPlaceholder")}
        value={description}
        onChangeText={setDescription}
        multiline
        textAlignVertical="top"
        style={{ minHeight: 88, paddingTop: 11 }}
      />
      {templates && templates.length > 0 ? (
        <>
          <Txt muted size={13}>
            {tl("includeTemplates")}
          </Txt>
          <ScrollView style={{ maxHeight: 200 }}>
            {templates.map((template) => (
              <View
                key={template._id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingVertical: 6,
                }}
              >
                <Switch
                  value={selected.includes(template._id)}
                  onValueChange={() => toggleTemplate(template._id)}
                  trackColor={{ true: t.primary, false: t.border }}
                />
                <Txt style={{ flex: 1 }}>
                  {template.name} ({template.items.length})
                </Txt>
              </View>
            ))}
          </ScrollView>
        </>
      ) : null}
      <Button
        title={busy ? tc("creating") : tl("createList")}
        disabled={busy || name.trim().length === 0}
        onPress={create}
      />
    </Sheet>
  );
}
