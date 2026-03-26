import * as v from "valibot";
import { DATE_LOCALE_VALUES, DEFAULT_DATE_LOCALE } from "@/lib/date-locale";

export const profileSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty(), v.trim()),
  avatarColor: v.optional(v.nullable(v.string())),
  dateLocale: v.fallback(v.picklist(DATE_LOCALE_VALUES), DEFAULT_DATE_LOCALE),
});
