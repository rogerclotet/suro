# Suro · Instagram carousel (Catalan)

10-slide explainer carousel based on the landing-page copy, in Catalan.
Copy is verbatim from `apps/web/src/i18n/messages/ca.json` (the `landing` section).

## Files

`slide-01.png` … `slide-10.png` — ready to upload, in order.

- **Format:** 1080×1350 (4:5 portrait, Instagram feed-optimal), rendered at 2× → 2160×2700 px.
- **Brand:** cream paper-grain background, white cards "pinned" with cork pushpins
  (suro = cork, Catalan → a shared corkboard), sage-green headings, Convergence type.

## Slide order

The six feature slides (3–8) each embed a faithful mini-mockup of the real app UI,
recreated in HTML to mirror the web info-page demos (same components, colors,
Catppuccin avatar palette and demo data — group "Cap de setmana a Sitges").

1. Cover — logo + "El suro compartit per a la gent amb qui comparteixes el dia a dia"
2. Promise — "Una sola app per a totes les decisions compartides"
3. Llistes — checklist with categories + progress bar (5/7)
4. Calendari — event card with a linked list (3/4)
5. Fitxers i notes — shared note + PDF file rows
6. Despeses compartides — per-member balance bars (green = is owed, red = owes)
7. Amic invisible — match reveal + hidden idea list
8. Mantén-te al dia — notifications feed
9. Per a qui — Companys de pis · Famílies · Colles d'amics
10. CTA — Google Play + App Store (tots dos actius) · "Enllaç a la descripció"

## Suggested caption

> El suro compartit per a la gent amb qui comparteixes el dia a dia. 🪵
>
> Llistes, calendari, fitxers, despeses compartides i amic invisible — tot en un sol
> lloc, perquè deixis de saltar entre xats, fulls de càlcul i recordatoris.
>
> Crea el teu primer grup en menys d'un minut. Descarrega Suro a Google Play i a l'App Store — enllaç a la bio. 👇
>
> #suro #organització #companysdepis #despesescompartides #amicinvisible #appcatalana #encatalà #famílies #collaadamics #productivitat

## Regenerate

Edit copy/design in `_source/generate.mjs`, then:

```sh
node _source/generate.mjs   # writes _source/slide-*.html
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for f in _source/slide-*.html; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --no-sandbox \
    --force-device-scale-factor=2 --window-size=1080,1350 \
    --default-background-color=00000000 \
    --screenshot="$(basename "$f" .html).png" "file://$PWD/$f"
done
```

Fonts (Convergence) and the logo are embedded as base64, so the PNGs render
identically offline. Source HTML keeps each slide editable.
