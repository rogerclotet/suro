import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import * as Clipboard from "expo-clipboard";
// SDK 56 keeps the stable download API behind the `/legacy` entry point.
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  CalendarArrowDown,
  CalendarPlus,
  Copy,
  Share2,
} from "lucide-react-native";
import { Alert, Linking, Platform, Share } from "react-native";
import { useTranslations } from "@/i18n";
import { convexSiteUrl } from "@/lib/urls";
import { Button, IconAction, IconActionBar, Sheet, Txt } from "@/ui";

/**
 * Bottom drawer of calendar-export options. Every method points at the same
 * token-gated `.ics` feed, so the choice is really "how do you want to consume
 * it": subscribe to the live feed (Apple/Google, one-way and auto-updating),
 * grab the link to paste elsewhere (share/copy), or save a one-time snapshot
 * file.
 * iOS handles `webcal://` natively (Apple Calendar); Android can't, so Google
 * Calendar's web subscribe flow is the primary path there.
 */
export function ExportCalendarSheet({
  projectId,
  visible,
  onClose,
}: {
  projectId: Id<"projects">;
  visible: boolean;
  onClose: () => void;
}) {
  const tCal = useTranslations("mobile.calendar");
  const tc = useTranslations("mobile.common");
  const getCalendarToken = useMutation(api.events.getOrCreateCalendarToken);
  const isIOS = Platform.OS === "ios";

  async function feedUrls() {
    const token = await getCalendarToken({ projectId });
    const httpsUrl = `${convexSiteUrl()}/calendar.ics?projectId=${projectId}&token=${token}`;
    const webcalUrl = httpsUrl.replace(/^https?:\/\//, "webcal://");
    return { httpsUrl, webcalUrl };
  }

  function reportFailure() {
    Alert.alert(tCal("exportCalendar"), tCal("exportFailed"));
  }

  // iOS opens Calendar via webcal:// and prompts to subscribe to the live feed.
  async function subscribeApple() {
    onClose();
    try {
      const { webcalUrl } = await feedUrls();
      await Linking.openURL(webcalUrl);
    } catch {
      reportFailure();
    }
  }

  // Android calendar apps don't register webcal://. Google Calendar's
  // ?cid=webcal://… link opens a confirm-subscription prompt; the webcal URL is
  // encoded because the feed carries query params that would otherwise break the
  // outer URL. Falls back to sharing the link if no browser is available.
  async function subscribeGoogle() {
    onClose();
    try {
      const { httpsUrl, webcalUrl } = await feedUrls();
      const subscribeUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`;
      try {
        await Linking.openURL(subscribeUrl);
      } catch {
        await Share.share({ message: httpsUrl });
      }
    } catch {
      reportFailure();
    }
  }

  // Native share/save actions present over the open sheet, then close it once
  // the user is done, which avoids a system sheet appearing mid-dismiss.
  async function shareLink() {
    try {
      const { httpsUrl } = await feedUrls();
      await Share.share({ message: httpsUrl, url: httpsUrl });
    } catch {
      reportFailure();
    } finally {
      onClose();
    }
  }

  // A one-time snapshot: download the feed's current contents to a file and hand
  // it to the system share/save sheet. Unlike subscribing, this doesn't update.
  async function downloadFile() {
    try {
      const { httpsUrl } = await feedUrls();
      const fileUri = `${FileSystem.cacheDirectory}suro-calendar.ics`;
      await FileSystem.downloadAsync(httpsUrl, fileUri);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/calendar",
          UTI: "com.apple.ical.ics",
          dialogTitle: tCal("exportCalendar"),
        });
      } else {
        await Share.share({ url: fileUri });
      }
    } catch {
      reportFailure();
    } finally {
      onClose();
    }
  }

  async function copyLink() {
    try {
      const { httpsUrl } = await feedUrls();
      await Clipboard.setStringAsync(httpsUrl);
      onClose();
      Alert.alert(tc("copiedToClipboard"));
    } catch {
      onClose();
      reportFailure();
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt size={18} weight="700">
        {tCal("exportCalendar")}
      </Txt>
      <Txt muted size={14} style={{ lineHeight: 20 }}>
        {tCal("exportExplainer")}
      </Txt>

      <Button
        title={isIOS ? tCal("subscribeApple") : tCal("subscribeGoogle")}
        onPress={isIOS ? subscribeApple : subscribeGoogle}
      />

      <IconActionBar>
        {isIOS ? (
          <IconAction
            icon={CalendarPlus}
            caption={tCal("googleCaption")}
            label={tCal("subscribeGoogle")}
            onPress={subscribeGoogle}
          />
        ) : null}
        <IconAction
          icon={Share2}
          caption={tCal("shareCaption")}
          label={tCal("shareLink")}
          onPress={shareLink}
        />
        <IconAction
          icon={Copy}
          caption={tCal("copyCaption")}
          label={tCal("copyLink")}
          onPress={copyLink}
        />
        <IconAction
          icon={CalendarArrowDown}
          caption={tCal("downloadCaption")}
          label={tCal("downloadFile")}
          onPress={downloadFile}
        />
      </IconActionBar>
    </Sheet>
  );
}
