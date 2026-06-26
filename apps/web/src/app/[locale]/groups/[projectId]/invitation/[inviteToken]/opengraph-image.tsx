import fs from "node:fs";
import path from "node:path";
import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import {
  CATPPUCCIN_COLORS,
  type CatppuccinColor,
} from "@/lib/catppuccin-colors";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Suro";

const BACKGROUND =
  "radial-gradient(ellipse 80% 70% at 18% 22%, rgba(245, 200, 110, 0.28), transparent 65%), #17100c";
const FOREGROUND = "#f7e4d7";
const MUTED = "rgba(247, 228, 215, 0.72)";
// Members with no Catppuccin color get the brand accent, mirroring the avatar
// fallbacks in the app (UserAvatar -> primary, ProjectAvatar -> peach).
const FALLBACK_SWATCH = { bg: "#fab387", fg: "#1e1e2e" } as const;
// How many member avatars fit before we collapse the rest into a "+N" chip.
const MAX_AVATARS = 8;

function swatch(color: string | null): { bg: string; fg: string } {
  return CATPPUCCIN_COLORS[color as CatppuccinColor] ?? FALLBACK_SWATCH;
}

function initial(name: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

/**
 * The OpenGraph card rendered when an invite link is unfurled (WhatsApp,
 * Telegram, etc.): the group's name plus its members' avatars, so the recipient
 * sees what — and who — they're joining before they tap. Falls back to generic
 * Suro branding on a missing/expired token. Member avatars are drawn as colored
 * initials rather than fetched images, which keeps rendering self-contained.
 */
export default async function InviteOpengraphImage({
  params,
}: {
  params: Promise<{ locale: string; projectId: string; inviteToken: string }>;
}) {
  const { locale, projectId, inviteToken } = await params;
  const t = await getTranslations({ locale, namespace: "invitation" });

  const preview = await fetchQuery(api.projects.getInvitePreview, {
    projectId: projectId as Id<"projects">,
    inviteToken,
  }).catch(() => null);

  const logoData = fs.readFileSync(
    path.join(process.cwd(), "public", "logo.png"),
  );
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  const frameStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "space-between" as const,
    padding: "72px",
    background: BACKGROUND,
    color: FOREGROUND,
    fontFamily: "system-ui, sans-serif",
  };

  if (!preview) {
    return new ImageResponse(
      <div style={frameStyle}>
        {/** biome-ignore lint/performance/noImgElement: Satori, not the browser */}
        <img src={logoSrc} width={120} height={120} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{ fontSize: 84, fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            {t("metadataInviteTitle")}
          </div>
          <div style={{ fontSize: 34, marginTop: 20, color: MUTED }}>
            {t("metadataInviteBody")}
          </div>
        </div>
      </div>,
      { ...size },
    );
  }

  const groupSwatch = swatch(preview.color);
  const shown = preview.members.slice(0, MAX_AVATARS);
  const extra = preview.members.length - shown.length;

  return new ImageResponse(
    <div style={frameStyle}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {/** biome-ignore lint/performance/noImgElement: Satori, not the browser */}
        <img src={logoSrc} width={72} height={72} alt="" />
        <div style={{ fontSize: 32, marginLeft: 24, color: MUTED }}>
          {t("groupTitle")}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 156,
            height: 156,
            borderRadius: 156,
            backgroundColor: groupSwatch.bg,
            color: groupSwatch.fg,
            fontSize: 78,
            fontWeight: 700,
          }}
        >
          {initial(preview.name)}
        </div>
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            marginLeft: 44,
            // Satori needs an explicit width to wrap a long single line.
            maxWidth: 760,
          }}
        >
          {preview.name}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 30, color: MUTED, marginBottom: 20 }}>
          {t("participants")}
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          {shown.map((member, index) => {
            const s = swatch(member.avatarColor);
            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: one-shot Satori render of a fixed list, no reconciliation; members carry no id by design
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 96,
                  height: 96,
                  borderRadius: 96,
                  marginLeft: index === 0 ? 0 : -22,
                  border: "5px solid #17100c",
                  backgroundColor: s.bg,
                  color: s.fg,
                  fontSize: 44,
                  fontWeight: 700,
                }}
              >
                {initial(member.name)}
              </div>
            );
          })}
          {extra > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 96,
                height: 96,
                borderRadius: 96,
                marginLeft: -22,
                border: "5px solid #17100c",
                backgroundColor: "#2a201a",
                color: FOREGROUND,
                fontSize: 38,
                fontWeight: 700,
              }}
            >
              {`+${extra}`}
            </div>
          )}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
