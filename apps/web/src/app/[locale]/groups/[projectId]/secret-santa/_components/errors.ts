import { ConvexError } from "convex/values";
import type { useTranslations } from "next-intl";

type Translate = ReturnType<typeof useTranslations<"secretSanta">>;

/** A localized explanation for an expected rejection, or null. */
export function secretSantaErrorMessage(
  error: unknown,
  t: Translate,
): string | null {
  if (!(error instanceof ConvexError)) return null;
  const data = error.data as { code?: string; reason?: string };
  switch (data.code) {
    case "ACTIVE_SECRET_SANTA_EXISTS":
      return t("errorActiveExists");
    case "NO_VALID_ASSIGNMENTS":
      return t("noValidAssignments");
    case "INVALID_EXCLUSION":
      return data.reason === "alreadyExists"
        ? t("exclusionAlreadyExists")
        : data.reason === "tooMany"
          ? t("exclusionMinError")
          : null;
    case "INVALID_URL":
      return t("validationInvalidUrl");
    case "PARTICIPANTS_LOCKED":
      return t("participantsLocked");
    case "ALREADY_DRAWN":
      return t("errorAlreadyDrawn");
    case "ARCHIVED":
      return t("errorArchived");
    default:
      return null;
  }
}
