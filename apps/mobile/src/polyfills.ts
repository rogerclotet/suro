/**
 * iOS Hermes ships only a partial Intl (DateTime/Number/Collator) — it has no
 * `Intl.PluralRules`, which `use-intl`'s ICU `{… plural …}` messages depend on,
 * so any pluralized string crashes at render with FORMATTING_ERROR. Install the
 * FormatJS polyfill and register the locales we ship.
 *
 * Safe on Android too: `/polyfill` self-checks via `shouldPolyfill()` and is a
 * no-op where a working native `PluralRules` exists (Android delegates to system
 * ICU), so the native implementation is left in place. Import order matters —
 * the polyfill must define `PluralRules` before the locale-data modules, which
 * call `__addLocaleData` on it (and are themselves no-ops when not polyfilled).
 *
 * The `.js` suffixes are required: the package's `exports` map only declares the
 * suffixed subpaths.
 */
import "@formatjs/intl-pluralrules/polyfill.js";
import "@formatjs/intl-pluralrules/locale-data/en.js";
import "@formatjs/intl-pluralrules/locale-data/ca.js";
import "@formatjs/intl-pluralrules/locale-data/es.js";
