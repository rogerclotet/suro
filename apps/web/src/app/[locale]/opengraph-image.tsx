import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Suro";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const title = t("title");
  const description = t("description");

  const logoData = fs.readFileSync(
    path.join(process.cwd(), "public", "logo.png"),
  );
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        padding: "96px",
        background:
          "radial-gradient(ellipse 80% 70% at 18% 22%, rgba(245, 200, 110, 0.28), transparent 65%), #17100c",
        color: "#f7e4d7",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/** biome-ignore lint/performance/noImgElement: ImageResponse runs in Satori, not the browser */}
      <img src={logoSrc} width={280} height={280} alt="" />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginLeft: "72px",
          flex: 1,
        }}
      >
        <div
          style={{
            fontSize: 132,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 34,
            marginTop: "28px",
            color: "rgba(247, 228, 215, 0.78)",
            lineHeight: 1.3,
          }}
        >
          {description}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
