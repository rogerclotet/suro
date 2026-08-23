# /// script
# requires-python = ">=3.11"
# ///
"""Capture the Wear OS store screenshots from the real app on a running emulator.

Run from anywhere:  uv run apps/mobile/store/capture-wear-screenshots.py

Outputs (committed to the repo):
  play/metadata/android/<locale>/images/wearScreenshots/01-home.png … 06-expenses.png

Prerequisites — see store/README.md for the full runbook:
  1. A Wear OS AVD is booted and is the only attached device.
  2. apps/wear is installed on it, signed with the phone app's debug keystore
     (`expo prebuild` the phone app first, then `./gradlew :app:assembleDebug`).
  3. The watch holds a session for the review account (SessionSeeder), and
     `seed:demoGroup` has been run for the locale being captured.

Navigation is driven off the accessibility tree rather than fixed coordinates,
because the labels move between locales and the round screen's scaling list
shifts rows as it scrolls.
"""

import re
import subprocess
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
PLAY_METADATA = Path(__file__).resolve().parent / "play/metadata/android"

PACKAGE = "dev.clotet.suro"
ACTIVITY = f"{PACKAGE}/dev.clotet.suro.wear.MainActivity"

# Labels to drive navigation, per locale. Keyed by the resource each one comes
# from so a strings.xml rename is easy to trace back.
LABELS = {
    "en-US": {
        "locale": "en",
        "lists": "Lists", "calendar": "Calendar", "expenses": "Expenses",
        # Landmarks unique to each destination, so a mis-tap fails loudly
        # instead of quietly shipping a screenshot of the wrong screen.
        "at_lists": "Favorites", "at_calendar": "Today", "at_pot": "Add expense",
        # The one seeded event that has a list linked to it — the whole point of
        # the calendar being on the watch, so it's what the shot has to show.
        "trip": "Weekend in la Cerdanya", "at_trip": "All day",
    },
    "es-ES": {
        "locale": "es",
        "lists": "Listas", "calendar": "Calendario", "expenses": "Gastos",
        "at_lists": "Favoritas", "at_calendar": "Hoy", "at_pot": "Añadir gasto",
        "trip": "Finde en la Cerdaña", "at_trip": "Todo el día",
    },
    "ca": {
        "locale": "ca",
        "lists": "Llistes", "calendar": "Calendari", "expenses": "Despeses",
        "at_lists": "Preferides", "at_calendar": "Avui", "at_pot": "Afegeix despesa",
        "trip": "Cap de setmana a la Cerdanya", "at_trip": "Tot el dia",
    },
}

# A round screen clips its top and bottom. Rows outside this band are partly
# under the bezel, and tapping their reported centre lands somewhere else.
SAFE_TOP, SAFE_BOTTOM = 90, 360


def adb(*args: str, binary: bool = False) -> bytes | str:
    result = subprocess.run(
        ["adb", *args], check=True, capture_output=True
    )
    return result.stdout if binary else result.stdout.decode("utf-8", "replace")


def shell(command: str) -> str:
    return adb("shell", command)


def nodes() -> list[tuple[str, tuple[int, int]]]:
    """Visible text nodes with the centre point of each, from the a11y tree."""
    shell("uiautomator dump /sdcard/ui.xml")
    dump = shell("cat /sdcard/ui.xml")
    found = []
    for node in re.finditer(r"<node[^>]*>", dump):
        text = re.search(r'text="([^"]*)"', node.group(0))
        bounds = re.search(r'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', node.group(0))
        if text and text.group(1) and bounds:
            x1, y1, x2, y2 = (int(g) for g in bounds.groups())
            found.append((text.group(1), ((x1 + x2) // 2, (y1 + y2) // 2)))
    return found


def find_text(needle: str) -> tuple[int, int] | None:
    for text, point in nodes():
        if text.startswith(needle):
            return point
    return None


def wait_for_text(needle: str, timeout: float = 20.0) -> None:
    """Block until `needle` is on screen, so a mis-tap fails here, not silently."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        if find_text(needle) is not None:
            return
        time.sleep(1)
    raise SystemExit(f"Expected {needle!r} on screen; the app is somewhere else.")


def tap_text(needle: str, timeout: float = 25.0) -> None:
    """Scroll `needle` clear of the bezel, then tap it."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        point = find_text(needle)
        if point is None:
            scroll_down(distance=120)
        elif point[1] > SAFE_BOTTOM:
            scroll_down(distance=point[1] - 220)
        elif point[1] < SAFE_TOP:
            scroll_down(distance=point[1] - 220)  # negative: scrolls back up
        else:
            shell(f"input tap {point[0]} {point[1]}")
            return
        time.sleep(1)
    raise SystemExit(f"Never found a tappable node labelled {needle!r}.")


def screenshot(locale: str, name: str) -> None:
    target = PLAY_METADATA / locale / "images/wearScreenshots" / f"{name}.png"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(adb("exec-out", "screencap", "-p", binary=True))
    print(f"  {target.relative_to(REPO_ROOT)}")


def scroll_down(times: int = 1, distance: int = 180) -> None:
    for _ in range(times):
        shell(f"input swipe 227 380 227 {380 - distance} 300")
        time.sleep(1)


def home() -> None:
    shell(f"am force-stop {PACKAGE}")
    shell("input keyevent KEYCODE_WAKEUP")
    shell(f"am start -n {ACTIVITY}")
    time.sleep(9)


def capture(locale: str) -> None:
    labels = LABELS[locale]
    print(f"{locale}:")
    shell(f"cmd locale set-app-locales {PACKAGE} --locales {labels['locale']}")
    # The screen dozes to the watch face mid-run otherwise, and every capture
    # after that is a clock.
    shell("settings put system screen_off_timeout 1800000")
    shell("settings put global ambient_enabled 0")

    home()
    # Nudge the list so all three destinations clear the bottom bezel; the group
    # name stays legible above them.
    scroll_down(distance=70)
    screenshot(locale, "01-home")

    tap_text(labels["lists"])
    wait_for_text(labels["at_lists"])
    screenshot(locale, "02-lists")
    scroll_down()
    # The first list card; its name is seeded content, so pick it positionally.
    shell("input tap 227 300"); time.sleep(6)
    # No scroll: the list's own title is what makes this shot readable.
    screenshot(locale, "03-list-detail")

    home()
    tap_text(labels["calendar"])
    wait_for_text(labels["at_calendar"])
    screenshot(locale, "04-calendar")
    tap_text(labels["trip"])
    wait_for_text(labels["at_trip"])
    # Past the title and description, down to the linked checklist itself.
    scroll_down(2)
    screenshot(locale, "05-event")

    home()
    tap_text(labels["expenses"]); time.sleep(6)
    shell("input tap 227 200")
    wait_for_text(labels["at_pot"])
    screenshot(locale, "06-expenses")


def main() -> None:
    devices = [
        line.split()[0]
        for line in adb("devices").splitlines()[1:]
        if line.strip().endswith("device")
    ]
    if len(devices) != 1:
        raise SystemExit(f"Expected exactly one attached device, found {devices}")

    wanted = sys.argv[1:] or list(LABELS)
    for locale in wanted:
        if locale not in LABELS:
            raise SystemExit(f"Unknown locale {locale!r}; expected one of {list(LABELS)}")
        capture(locale)


if __name__ == "__main__":
    main()
