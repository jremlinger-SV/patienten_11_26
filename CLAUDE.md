# DVO Osteoporose-Frakturrisiko-Rechner – PATIENTENVERSION

## Was das ist
Die **Patienten-Variante** des DVO-Frakturrisiko-Rechners. Abgeleitet vom
Fachkreis-Rechner („DOUV Kalkulator"), aber für Laien gedacht: gibt eine
**erste, unverbindliche Einschätzung** des 3-Jahres-Frakturrisikos nach der
**S3-Leitlinie DVO Osteoporose 2023**. Erstellt als Tool des Deutschen Orthopäden-
und Unfallchirurgen-Verbandes e.V. (DOUV, www.douv.de).

**Wesentliche Unterschiede zur Arztversion:**
- **Keine konkrete Therapieempfehlung / keine Substanz- oder Medikamentenlisten.**
  Stattdessen patiententaugliche Leitlinien-Hinweise je Risikozone plus klarer
  Disclaimer („… nur Ihre Ärztin/Ihr Arzt kann den Therapieplan festlegen").
- **Knochendichtemessung optional:** Schritt 3 fragt per Ja/Nein ab, ob eine
  Messung erfolgte und ob das Ergebnis bekannt ist. Nur bei **2× Ja** erscheint der
  T-Wert-Schieberegler. Sonst wird ein **altersabhängiger durchschnittlicher T-Wert**
  (Gesamthüfte) als Orientierung eingesetzt – Tabelle `AVG_TSCORE` mit linearer
  Interpolation (`avgTscoreForAge`), z. B. 65 J. ≈ −1,5, 80 J. ≈ −2,3. Der Hinweis
  betont ausdrücklich, dass dieser Mittelwert **keine Vorhersagekraft** für die
  einzelne Person hat und eine echte Messung nicht ersetzt.
- **Layout** bewusst von der Arztversion abgesetzt: Hero-Banner in klinischem
  **Pastellgrün** (Arztversion = Navy), durchgehend **serifenlose** Typografie.
- **Patienten-Zusammenfassung (statt PDF):** nur Angaben, Risikofaktoren und
  unverbindliche Einschätzung + Disclaimer, angezeigt **auf der Seite**. Keine
  Wirkstofftabellen, keine ärztlichen Schwellenwert-Tabellen, kein „Nur für
  Fachpersonal".

Die Anwendung ist im Kern **eine HTML-Datei** (HTML + CSS + UI-JS inline, keine
Build-Tools). Der **Berechnungskern liegt in `calc.js`** und wird per
`<script src="calc.js">` eingebunden. **Keine externen JS-Abhängigkeiten** – die
jsPDF-Einbindung ist in dieser Variante entfallen (s. „Reduzierte Variante").

## ⚠️ Sicherheits-Leitplanke (medizinische Anwendung)
Auch wenn die Patientenversion keine direkte Therapieempfehlung ausgibt, basiert
die Einschätzung auf medizinischer Logik. Ein Rechenfehler kann eine falsche
Selbsteinschätzung auslösen.

- **`calc.js` ist mit der Arztversion identisch und bleibt es.** Jede Änderung an
  der Berechnungslogik MUSS `node test.js` bestehen (Exit-Code 0 = ok, 1 = Fehler),
  bevor sie als fertig gilt. Niemals eine Logikänderung committen ohne grünen Lauf.
- Werte in `RF[]` (Risikogradienten) und `TABLES{}` (Schwellentabellen) stammen
  aus der DVO-Leitlinie. **Nur mit Beleg aus der Leitlinie ändern**, nie „nach
  Gefühl".
- Bei Unsicherheit über einen Tabellenwert: nachfragen, nicht raten.
- Patiententexte dürfen frei patiententauglich formuliert werden – aber die
  **Risikozuordnung (3 %/5 %/10 %) und der Disclaimer müssen leitliniengetreu und
  vollständig** bleiben.

## Reduzierte Variante (dieser Ordner)
Dieser Ordner ist eine **eigenständige Dublette** von „DOUV Patientenkalkulator" und
wird **parallel** dazu eingesetzt – je nach Praxis die eine oder die andere Version.
Änderungen hier dürfen die normale Version **nicht** berühren (und umgekehrt).

Hintergrund: Manche Praxen wollen **keinen PDF-Download und keinen PDF-Versand**
(Datenschutz), sondern nur eine Anzeige am Bildschirm. Deshalb gilt hier:
- Auf der Ergebnisseite gibt es **nur einen Button: „Zusammenfassung anzeigen"**
  (toggelt, Label wechselt auf „Zusammenfassung ausblenden"). Die früheren Buttons
  „PDF anzeigen" und „Herunterladen" sowie die jsPDF-CDN-Einbindung sind entfernt.
- `buildSummaryHTML()` rendert **inhaltlich genau das frühere PDF**: Kopf (Titel,
  Datum, DOUV), 1. Basisdaten, 2. Ausgewählte Risikofaktoren (nach Gruppen),
  3. Risiko-Einordnung mit Farbband, Hinweis zum durchschnittlichen T-Wert (nur
  ohne Knochendichtemessung), Verweis auf ärztliche Beratung inkl. Link auf
  osteoporose-verstehen.de und Fußzeile. **Wird am PDF-Inhalt der normalen Version
  etwas geändert, hier nachziehen.**
- `renderResult()` und `resetAll()` rufen `hideSummary()`, damit nie eine veraltete
  Zusammenfassung stehen bleibt.
- Es wird **keine Datei erzeugt, gespeichert oder versendet**.
- In der Risikofaktor-Liste der Zusammenfassung steht rechtsbündig der
  **Risikogradient** je Faktor (`fmtGrad`, deutsches Dezimalkomma – dieselbe
  Formatierung wie die Badges in Schritt 2), darunter eine kurze Legende.
- `RF_NOTE` hält **patiententaugliche Erläuterungen zu Fachbegriffen**
  (z. B. MGUS), die `rfLabel()` an die Beschriftung aus `calc.js` anhängt –
  in Schritt 2 **und** in der Zusammenfassung. Bewusst in der HTML und **nicht**
  in `calc.js`, damit der Rechenkern mit der Arztversion identisch bleibt.

### Veraltete Warnung entfernt
Hier stand bis 2026-11-11 der Hinweis, der Spaltenversatz in `TABLES.f.t10[90]`
sei in `DOUV Kalkulator` und `DOUV Kalkulator Praxis` noch nicht korrigiert.
**Das stimmt nicht mehr:** Alle vier `calc.js` (Arztversion, Praxis, Patient,
Patient reduziert) sind byteidentisch (MD5 `ea1b5a34…`) und enthalten den
korrigierten Wert.

## Dateien
- `Patientenkalkulator.html` – die Anwendung / UI. **Single Source of Truth für die
  UI.** Bindet `calc.js` per `<script src>` ein; die Rechenfunktionen darin
  (`getThresh`, `getGrad`, `computeS1`) sind nur **dünne Wrapper** auf `DVO`
  (UI-Zustand → DVO-Parameter). Patiententexte stehen in den Konstanten `REC_TXT`
  (Empfehlung je Schwelle), `DISCLAIMER` und `BMD_DEFAULT_NOTE`. Eine
  Medikamentenliste (`MEDS`) gibt es hier **nicht mehr**.
- `calc.js` – der UI-freie Berechnungskern und **Single Source of Truth für die
  Logik**. Enthält `RF`, `TABLES`, `interp`, `getThresh`, `getGrad`, `computeS1`,
  `evaluate`. Läuft in Node und Browser (exportiert `module.exports` bzw. `window.DVO`).
- `test.js` – Headless-Test-Suite. `node test.js`, Exit-Code 0/1.
- `presentations/`, `reference/` – Begleitmaterial, kein Code.
- `.claude/launch.json` – Mini-Node-Static-Server (Port 8767, Name `patient-reduziert`)
  für die Browser-
  Verifikation. **Muss auf diesen Ordner und `Patientenkalkulator.html` zeigen**
  (war nach dem Duplizieren noch auf den alten Ordner gesetzt – ist korrigiert).

### Logik nur an EINER Stelle
`calc.js` ist die einzige Logik-Quelle; die HTML enthält **keine eigene Kopie** von
`RF`/`TABLES`/`interp`/`getThresh`/`getGrad`/`computeS1`. **Logikänderungen
ausschließlich in `calc.js`**, danach `node test.js`.

## Berechnungslogik (Kernregeln)
1. **Risikogradient je Faktor** (`getGrad`): es wird **immer der Spaltenwert
   „Alter 70" (`g70`)** verwendet – unabhängig vom Patientenalter, **keine
   Altersinterpolation**. So macht es auch die DVO-Broschüre (Beispiel „Vera,
   60 J.": Wirbelfraktur 2,9 × Diabetes Typ 1 2,5 = 7,25 nutzt die Alter-70-Werte).
   `gHi` ist nur Referenz und fließt **nicht** in die Berechnung ein.
2. **Schritt-1-Faktor** (`computeS1`): pro Risikofaktor-**Gruppe** wird nur der
   stärkste Faktor gewählt. Dann werden die **zwei stärksten Gruppen
   multipliziert**. Eine Gruppe → Faktor = dieser Wert. Keine → Faktor = 1.
3. **Schwellen-Lookup** (`interp`): **Nearest-Neighbour**, KEINE lineare
   Interpolation. Nächstgelegene Alterszeile und T-Score-Spalte. Bei Gleichstand
   beim Alter (z. B. exakt 62,5 J.) wird die **höhere** Altersgruppe gewählt.
   Schritte: Alter 50–90 in 5-Jahres-Sprüngen, T-Score 0 bis −4,0 in 0,5er-Schritten.
4. **Schwelle erreicht**, wenn `S1-Faktor >= Tabellenwert`. Hierarchie:
   10 % ⇒ 5 % ⇒ 3 % (höhere Schwelle impliziert niedrigere).
   Tabellenwert `1.0` = Schwelle bereits ohne Risikofaktoren erreicht.
5. **Patientenspezifisch (nur UI, nicht calc.js):** Liegt keine
   Knochendichtemessung vor (eine der beiden Ja/Nein-Fragen = nein), setzt die UI
   `S.tscore = avgTscoreForAge(S.age)` (altersabhängiger Mittelwert aus `AVG_TSCORE`)
   und rechnet damit ganz normal über `calc.js`. Reiner Orientierungswert.

## Setup & Tests ausführen
Node.js wird benötigt (einmalig: `brew install node`).
```bash
node test.js          # Exit 0 = alle grün, 1 = Fehler
```
Die Suite prüft: (A) die 3 DVO-Referenzfälle, (B) Nearest-Neighbour-Grenzwerte,
(C) Schwellenlogik-Grenzfälle, (D) Invarianten (Monotonie, alle Werte ≥ 1,0,
Schwellen-Hierarchie). Die Monotonie-Prüfung deckt seit 2026-08-03 **alle drei
Schwellen (3/5/10 %)** ab – vorher nur 5 %, weshalb der Spaltenversatz in
`f.t10[90]` unentdeckt blieb.

**HTML-Verifikation (Browser):** `node test.js` testet nur `calc.js`. Wird die UI
oder die Wrapper-Schicht in der HTML geändert, zusätzlich im Browser prüfen – die
HTML lädt `calc.js` relativ, daher über einen lokalen Server öffnen (sonst greift
bei `file://` ggf. CORS).

## Offene Punkte / bekannte Themen
- **„Ohne Knochendichte":** aktuell altersabhängiger Durchschnitts-T-Wert
  (`AVG_TSCORE`, Quelle: vom Auftraggeber gelieferte Studienmittelwerte) als reine
  Orientierung. Eine alternative/echte Berechnung über die o.BMD-Spalte der DVO-
  Tabellen wäre eine **Logikänderung in `calc.js`** (neue Tabellenspalte) und müsste
  gegen die Leitlinie belegt + getestet werden – bislang nicht umgesetzt.
- ~~**Fall 3b klärungsbedürftig**~~ → **ERLEDIGT (2026-08-03).** Gegen die Original-
  Leitlinie geprüft (S3-Leitlinie DVO, S. 262, Tabelle „Männer – Faktor, um 10 %
  Schwelle zu erreichen"): `TABLES.m.t10[70][-2,5] = 1,7` ist **korrekt**. Der Code
  rechnet richtig; die ⚠-Markierung im Test ist nur noch ein Hinweis.
- ~~`TABLES{}` vollständig verifizieren~~ → **ERLEDIGT (2026-08-03).** Vollständiger
  Zellabgleich aller **486 Zellen** (2 Geschlechter × 3 Schwellen × 9 Alterszeilen ×
  9 T-Spalten) gegen die Leitlinie S. 261 (Frauen) / S. 262 (Männer). Ergebnis:
  **alle 486 Zellen stimmen überein**, nachdem ein Fehler behoben wurde (s. u.).
- Ebenso verifiziert: alle **47 Risikogradienten** (`RF[].g70`) gegen die Spalte
  „Faktor Alter 70" der Leitlinientabelle (Kap. 9.4.6.1, S. 263 f.) – **alle korrekt**.
  Hinweis: `RF` enthält mit `wkfx_o` einen Eintrag, der in der Leitlinie nur
  Zwischenüberschrift ist (Wert = der von „2 osteoporotische Wirbelbrüche").
  Zusätzlich ist `fam_hip.gHi` = 1,3, die Leitlinien-Spanne ist 1,2→1,5 (Maximum 1,5).
  Beides ohne Rechenwirkung, da `gHi` nicht in die Berechnung eingeht.

### Behobener Rechenfehler (2026-08-03)
`TABLES.f.t10[90]` war **um eine Spalte verschoben**: `[1.0,4,3,2.1,1.5,…]` statt
`[4,3,2.1,1.5,1.0,…]`. Ursache: Beim Abtippen wurde die Spalte **„ohne BMD"** (bei
Alter 90 farbig markiert ⇒ 1,0) versehentlich als erster Wert übernommen.
Auswirkung: Frauen ab 87,5 Jahren (Nearest-Neighbour ⇒ Zeile 90) bei der 10 %-Schwelle –
u. a. wurde für T = 0,0 ohne jeden Risikofaktor fälschlich „über 10 %" statt „unter 3 %"
ausgegeben. Behoben und durch den erweiterten Monotonie-Test abgesichert.

**Stand 2026-11-11:** In allen Schwesterprojekten (`DOUV Kalkulator`,
`DOUV Kalkulator Praxis`, `DOUV Patientenkalkulator`) ist derselbe Fehler
ebenfalls behoben – alle vier `calc.js` sind byteidentisch.

## Stil / Konventionen
- Sprache der Oberfläche und aller Texte: **Deutsch**, patiententauglich (Sie-Form).
- **Typografie:** durchgehend serifenlos (**DM Sans**, alle Gewichte). Die früher
  in Überschriften/Werten genutzte Serifenschrift `DM Serif Display` wird **nicht**
  mehr verwendet – Überschriften nutzen dieselbe Schrift wie der Fließtext.
- **Farbschema:** Hero/Kopfbanner in klinischem **Pastellgrün**
  (`#dcefe1 → #c6e3cf → #aed5ba`, Text `#1f4d33`). Navy (`#1c2e47`) bleibt für
  Header-Leiste/Footer; Salbei-Grün (`#6a9e72`) für Aktions-Buttons;
  Orange/Rot/Gelb/Grün für die Risikozonen.
- Keine externen JS-Frameworks. Vanilla JS, inline.
- **Kein PDF-Export.** Die Ergebnisseite zeigt die Zusammenfassung direkt auf der
  Seite (`toggleSummary` / `buildSummaryHTML`); dort gilt normales Unicode, die
  frühere ASCII-Ersetzung `pdfStr()` wird nicht mehr gebraucht.
</content>
- Am Ende von Abschnitt 2 steht das Feld **„Gesamt-Risiko-Faktor aus Ihren
  Angaben“** – derselbe Wert wie die Faktor-Leiste in Schritt 2 (beide aus
  `computeS1()`), plus eine Zeile, welche beiden Bereiche multipliziert wurden.
  Alle Faktor-Anzeigen (Schritt 2, Seitenleiste, Zusammenfassung) laufen über
  `fmtFactor` / `fmtGrad` und nutzen das **deutsche Dezimalkomma**.
