# Piacfigyelő rendszer (marketwatch)

Cél: a marketplace-ek (Árukereső, Árgép, eMAG) folyamatos, **kíméletes tempójú**
figyelése, hogy az árazás és a platform-kiválasztás mindig friss versenyadatokon
alapuljon. A Depiend-akciókat külön automatizmus figyeli (óránkénti Netlify
function), ahhoz nem kell kézi futtatás.

## Napi menet (az ütemezett feladat ezt követi)

1. **Állapot beolvasása**: `data/marketwatch/state.json` — melyik platformon
   hol tart a kurzor, mik a napi limitek és a kötelező kérés-közök.
2. **Cikkszám-lista**: a `src/data/products.generated.json` katalógus-sorrendje
   adja a sorrendet; a kurzortól folytatjuk, a lista végén elölről (frissítő kör).
3. **Lekérdezés platformonként** — MINDIG a Browser pane-ben (böngészős fetch),
   soha nem szerver-oldalról:
   - **Árgép**: `GET /trend/PORT/Portwest-{cikkszám kisbetűvel}.html` —
     a legolcsóbb ár a `data-priceLowLmt="(\d+)"` regexből; 404 = nincs fent (0).
     Max 250/nap, 45 mp kérés-köz. HTTP 429 esetén 2 perc szünet.
     FIGYELEM: gyorsabb tempó IP-szintű Cloudflare 1015 tiltást okoz, ami a
     felhasználó saját böngészését is blokkolja!
   - **Árukereső**: `GET /CategorySearch.php?st=portwest+{ART}` —
     `.product-box` kártyák, `.name`-ben cikkszám-egyezés, min("Ft-tól" árak).
     Max 500/nap, 2 mp kérés-köz.
   - **eMAG**: `GET /search/portwest%20{ART}` — kártya-cím a
     `a[title], .card-v2-title` szelektorból, a cikkszám a variánskód elején
     (pl. FW42BKR39) vagy zárójelben. Max 100/nap, 5 mp kérés-köz.
     Az ELSŐ captcha-jelre (HTTP 511 vagy "eMAG Captcha" cím) AZONNAL leállni.
     CAPTCHA-t megkerülni TILOS.
4. **Eredmények mentése**: `data/marketwatch/{platform}_prices.json`-ba merge
   (cikkszám → legolcsóbb ár Ft; 0 = nincs listázva), kurzor + dátum frissítése
   a state.json-ban.
5. **Alkalmazás**: `node scripts/marketwatch-apply.mjs` — az Árgép-adat a feed
   versenyszűrőjébe kerül, az Árukereső-adat átárazza a katalógust.
6. **Kitelepítés**: `npm run build`, majd commit + push (auto-deploy).
   Commit-üzenet: `Marketwatch: {platform} {tól}-{ig} ({N} új adat)`.

## Árazási szabályok (nem módosítandók egyeztetés nélkül)

- versenyár mínusz 10 Ft; padló = beszerzés × 1,05; plafon = beszerzés × 2,2
- kiszerelés-gyanú: ha a versenyár < beszerzés × 0,8 → az adat gyanús,
  a padló véd, de érdemes jelezni
- kézi áras (priceManual) termékhez a szinkron nem nyúl

## Platform-stratégia (mikor kerül ki egy termék)

| Platform | Feltétel |
|---|---|
| Árukereső feed | minden látható, készleten lévő termék (a padló véd) |
| Árgép feed | árrés ≥ 500 Ft ÉS (nincs fent az Árgépen VAGY mi vagyunk olcsóbbak) |
| eMAG (kézi) | jutalék után is pozitív fedezet — lásd elemzés (~90-190 termék) |
