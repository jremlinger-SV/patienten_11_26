/**
 * DVO Osteoporose-Kalkulator – Berechnungskern
 * ================================================
 * Eigenständiges, UI-freies Modul. Identisch zur Logik in der HTML-Anwendung.
 * Läuft in Node.js (für Tests) und im Browser (per <script src="calc.js">).
 *
 * WICHTIG (medizinische Anwendung):
 * Jede Änderung an diesem Modul MUSS gegen test.js geprüft werden.
 * Die Werte in RF[] und TABLES{} stammen aus der DVO-Leitlinie Osteoporose 2023
 * und dürfen nur mit Beleg aus der Leitlinie geändert werden.
 *
 * Single Source of Truth: Wenn die HTML-Anwendung geändert wird, müssen
 * RF[], TABLES{}, interp(), getGrad() und computeS1() hier synchron bleiben.
 */

'use strict';

// ─── RISIKOFAKTOREN ───
// g70 = Spalte "Alter 70" der DVO-Broschüre/Leitlinie (Tabelle 1). DIESER Wert
//       wird für die Berechnung verwendet – unabhängig vom Patientenalter.
// gHi = Endpunkt des Bereichs "Alter 50–90" der Tabelle. Nur als Referenz
//       vorgehalten, fließt NICHT in die Berechnung ein.
var RF = [
  {group:"Wirbelfrakturen",items:[
    {id:"wkfx_r",label:"Wirbelfraktur(en) im letzten Jahr",g70:2.9,gHi:3.0},
    {id:"wkfx_o",label:"Wirbelfraktur(en) > 12 Monate",g70:2.9,gHi:3.0},
    {id:"wkfx_1",label:"1 osteoporotischer Wirbelbruch",g70:2.0,gHi:2.0},
    {id:"wkfx_2",label:"2 osteoporotische Wirbelbrüche",g70:2.9,gHi:3.0},
    {id:"wkfx_3",label:"3+ osteoporotische Wirbelbrüche",g70:5.0,gHi:5.4},
    {id:"wkfx_g1",label:"Wirbelbruch Grad 1 (Genant)",g70:2.0,gHi:2.0},
    {id:"wkfx_g2",label:"Wirbelbruch Grad 2 (Genant)",g70:2.9,gHi:3.0},
    {id:"wkfx_g3",label:"Wirbelbruch Grad 3 (Genant)",g70:5.0,gHi:5.3}
  ]},
  {group:"Hüftfraktur & andere Frakturen",items:[
    {id:"hip_r",label:"Hüftfraktur im letzten Jahr",g70:4.1,gHi:5.1},
    {id:"hip_o",label:"Hüftfraktur > 12 Monate",g70:2.5,gHi:2.8},
    {id:"humerus",label:"Humerusfraktur",g70:1.7,gHi:1.7},
    {id:"wrist",label:"Handgelenksfraktur",g70:1.6,gHi:1.7},
    {id:"pelvis",label:"Beckenfraktur",g70:1.7,gHi:2.2}
  ]},
  {group:"Allgemeine Risikofaktoren",items:[
    {id:"fam_hip",label:"Elternteil mit Hüftbruch",g70:1.3,gHi:1.3},
    {id:"alcohol",label:"Alkohol ≥ 50 g/Tag",g70:1.9,gHi:1.9},
    {id:"smoking",label:"Rauchen (aktuell > 10 Zigaretten/Tag)",g70:1.5,gHi:1.5},
    {id:"copd",label:"Chronische obstruktive Lungenerkrankung (COPD)",g70:1.3,gHi:1.3},
    {id:"bmi15",label:"BMI ≤ 15 kg/m²",g70:2.2,gHi:2.9},
    {id:"bmi18",label:"BMI 15–18,5 kg/m²",g70:1.7,gHi:2.0},
    {id:"bmi20",label:"BMI 18,5–20 kg/m²",g70:1.3,gHi:1.4}
  ]},
  {group:"Rheumatologie & Glukokortikoide",items:[
    {id:"spa",label:"Axiale Spondyloarthritis",g70:1.6,gHi:1.7},
    {id:"ra",label:"Rheumatoide Arthritis",g70:2.7,gHi:2.7},
    {id:"pred1",label:"Prednisolon <= 2,5 mg/d > 3 Mo.",g70:1.4,gHi:1.4},
    {id:"pred2",label:"Prednisolon 2,5-7,5 mg/d > 3 Mo.",g70:2.3,gHi:2.3},
    {id:"pred3",label:"Prednisolon > 7,5 mg/d > 3 Mo.",g70:4.0,gHi:4.3},
    {id:"pred4",label:"Prednisolon >= 7,5 mg/d, neu letztes Jahr",g70:4.9,gHi:5.4}
  ]},
  {group:"Sturzrisiko / Geriatrie",items:[
    {id:"falls2",label:"> 1 Sturz im letzten Jahr",g70:2.0,gHi:2.1},
    {id:"falls1",label:"1 Sturz im letzten Jahr",g70:1.6,gHi:1.6},
    {id:"hypoNa",label:"Chronische Hyponatriämie",g70:1.4,gHi:1.7},
    {id:"depress",label:"Depression / Antidepressiva",g70:1.3,gHi:1.3},
    {id:"epilepsy",label:"Epilepsie",g70:1.2,gHi:1.4},
    {id:"immob",label:"Immobilität (Gehhilfe notwendig)",g70:1.7,gHi:1.8},
    {id:"alzheimer",label:"M. Alzheimer / Demenz",g70:1.6,gHi:2.1},
    {id:"parkinson",label:"M. Parkinson",g70:1.7,gHi:2.2},
    {id:"ms",label:"Multiple Sklerose",g70:2.1,gHi:2.7},
    {id:"opioids",label:"Opioide",g70:1.4,gHi:1.7},
    {id:"stroke",label:"Schlaganfall",g70:1.6,gHi:2.0},
    {id:"tug",label:"Timed Up and Go > 12 Sek.",g70:1.8,gHi:2.4}
  ]},
  {group:"Endokrinologie",items:[
    {id:"dm1",label:"Diabetes mellitus Typ 1",g70:2.5,gHi:3.3},
    {id:"dm2a",label:"Diabetes mellitus Typ 2, seit 5–10 J.",g70:1.1,gHi:1.3},
    {id:"dm2b",label:"Diabetes mellitus Typ 2, seit > 10 J.",g70:1.6,gHi:2.0},
    {id:"phpt",label:"Primärer Hyperparathyreoidismus",g70:2.2,gHi:2.4},
    {id:"tsh1",label:"TSH 0,1–0,45 mU/l",g70:1.2,gHi:1.3},
    {id:"tsh2",label:"TSH < 0,1 mU/l",g70:1.2,gHi:1.4}
  ]},
  {group:"Weitere Erkrankungen / Medikationen",items:[
    {id:"hf",label:"Chronische Herzinsuffizienz",g70:1.5,gHi:1.5},
    {id:"mgus",label:"MGUS",g70:2.0,gHi:2.1},
    {id:"ckd",label:"Niereninsuffizienz CKD 3a, 3b, 4",g70:1.6,gHi:1.8},
    {id:"ppi",label:"Protonenpumpenhemmer > 3 Mo.",g70:1.4,gHi:1.4}
  ]}
];

// ─── THERAPIESCHWELLEN-TABELLEN ───
// Spalten: T-Score 0, -0.5, -1.0, -1.5, -2.0, -2.5, -3.0, -3.5, -4.0
// Wert = benötigter S1-Faktor um die jeweilige Schwelle zu erreichen.
// 1.0 = roter Bereich (Schwelle bereits ohne Risikofaktoren erreicht).
var T_COLS = [0,-0.5,-1,-1.5,-2,-2.5,-3,-3.5,-4];
var AGE_ROWS = [50,55,60,65,70,75,80,85,90];
var TABLES = {
  f:{
    t10:{
      50:[42,31,23,17,13,9,7,5,3.7],
      55:[28,21,16,12,9,6,5,3.5,2.5],
      60:[19,14,11,8,6,4.4,3.2,2.4,1.7],
      65:[14,10,7.5,6,4,3.1,2.3,1.7,1.0],
      70:[10,7,5.5,4.1,3,2.2,1.6,1.0,1.0],
      75:[8,6,4.2,3.1,2.2,1.6,1.2,1.0,1.0],
      80:[6,4.4,3.2,2.4,1.7,1.3,1.0,1.0,1.0],
      85:[5,3.6,2.6,1.9,1.3,1.0,1.0,1.0,1.0],
      90:[4,3,2.1,1.5,1.0,1.0,1.0,1.0,1.0]
    },
    t5:{
      50:[21,16,12,9,6,5,3.5,2.5,2],
      55:[14,10,8,6,4,3,2.3,1.7,1.0],
      60:[10,7,5,4,3,2.2,1.6,1.0,1.0],
      65:[7,5,4,3,2.1,1.5,1.0,1.0,1.0],
      70:[5,4,2.7,2.0,1.5,1.1,1.0,1.0,1.0],
      75:[4,3,2.1,1.5,1.1,1.0,1.0,1.0,1.0],
      80:[3,2.2,1.6,1.2,1.0,1.0,1.0,1.0,1.0],
      85:[2.4,1.8,1.3,1.0,1.0,1.0,1.0,1.0,1.0],
      90:[2,1.4,1.0,1.0,1.0,1.0,1.0,1.0,1.0]
    },
    t3:{
      50:[13,9,7,5,4,3,2.1,1.5,1.0],
      55:[8,6,5,3.5,2.6,1.9,1.4,1.0,1.0],
      60:[6,4,3,2.4,1.8,1.3,1.0,1.0,1.0],
      65:[4,3,2.3,1.7,1.2,1.0,1.0,1.0,1.0],
      70:[3,2.2,1.6,1.2,1.0,1.0,1.0,1.0,1.0],
      75:[2.3,1.7,1.2,1.0,1.0,1.0,1.0,1.0,1.0],
      80:[1.8,1.3,1.0,1.0,1.0,1.0,1.0,1.0,1.0],
      85:[1.5,1.1,1.0,1.0,1.0,1.0,1.0,1.0,1.0],
      90:[1.2,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0]
    }
  },
  m:{
    t10:{
      50:[33,23,16,11,8,5,3.6,2.5,1.7],
      55:[26,18,12,8,6,4,2.6,1.8,1.0],
      60:[20,14,9,6,4,3,1.9,1.0,1.0],
      65:[16,11,7,5,3,2.2,1.5,1.0,1.0],
      70:[12,8,6,4,2.5,1.7,1.0,1.0,1.0],
      75:[10,7,4.5,3,2.0,1.3,1.0,1.0,1.0],
      80:[8,5,3.6,2.4,1.6,1.0,1.0,1.0,1.0],
      85:[7,4,2.8,1.8,1.2,1.0,1.0,1.0,1.0],
      90:[5,3,2,1.3,1.0,1.0,1.0,1.0,1.0]
    },
    t5:{
      50:[17,12,8,6,4,2.6,1.8,1.0,1.0],
      55:[13,9,6,4,2.9,2,1.0,1.0,1.0],
      60:[10,7,5,3.2,2.2,1.5,1.0,1.0,1.0],
      65:[8,5,3.6,2.4,1.6,1.0,1.0,1.0,1.0],
      70:[6,4,2.8,1.9,1.3,1.0,1.0,1.0,1.0],
      75:[5,3.4,2.3,1.5,1.0,1.0,1.0,1.0,1.0],
      80:[4,2.7,1.8,1.2,1.0,1.0,1.0,1.0,1.0],
      85:[3.3,2.1,1.4,1.0,1.0,1.0,1.0,1.0,1.0],
      90:[2.4,1.5,1.0,1.0,1.0,1.0,1.0,1.0,1.0]
    },
    t3:{
      50:[10,7,5,3.4,2.3,1.6,1.1,1.0,1.0],
      55:[8,5,3.7,2.5,1.7,1.2,1.0,1.0,1.0],
      60:[6,4,2.8,1.9,1.3,1.0,1.0,1.0,1.0],
      65:[5,3,2.2,1.5,1.0,1.0,1.0,1.0,1.0],
      70:[4,2.5,1.7,1.1,1.0,1.0,1.0,1.0,1.0],
      75:[3,2,1.4,1.0,1.0,1.0,1.0,1.0,1.0],
      80:[2.4,1.6,1.1,1.0,1.0,1.0,1.0,1.0,1.0],
      85:[2,1.3,1.0,1.0,1.0,1.0,1.0,1.0,1.0],
      90:[1.4,1.0,1.0,1.0,1.0,1.0,1.0,1.0,1.0]
    }
  }
};

// ─── KERN-FUNKTIONEN ───────────────────────────────────

/**
 * Nearest-Neighbour-Lookup in einer Schwellentabelle.
 * Nimmt den Tabellenwert der dem tatsächlichen Alter / T-Score am nächsten liegt.
 * Bei Gleichstand beim Alter (z.B. exakt 62,5) wird die HÖHERE Altersgruppe genommen.
 * @returns {number} benötigter S1-Faktor (>= 1.0)
 */
function interp(table, age, ts) {
  var a = Math.min(Math.max(age, 50), 90);
  var tv = Math.min(Math.max(ts, -4), 0.5);

  var bestAi = 0, bestDist = Infinity;
  AGE_ROWS.forEach(function(r, i){
    var d = Math.abs(r - a);
    if (d < bestDist || (d === bestDist && r > AGE_ROWS[bestAi])) { bestDist = d; bestAi = i; }
  });

  var bestTi = 0; bestDist = Infinity;
  T_COLS.forEach(function(c, i){
    var d = Math.abs(c - tv);
    if (d < bestDist) { bestDist = d; bestTi = i; }
  });

  function get(ri, ci) { var r = table[AGE_ROWS[ri]]; return (r && r[ci] != null) ? r[ci] : 1.0; }
  return Math.max(get(bestAi, bestTi), 1.0);
}

/**
 * Liefert den benötigten S1-Faktor für eine Schwelle (3, 5 oder 10 %).
 */
function getThresh(gender, level, age, tscore) {
  var k = level === 10 ? 't10' : level === 5 ? 't5' : 't3';
  return interp(TABLES[gender][k], age, tscore);
}

/**
 * Risikogradient eines Einzelfaktors.
 * Gemäß DVO-Broschüre/Leitlinie wird IMMER der Spaltenwert "Alter 70" (g70)
 * verwendet – unabhängig vom tatsächlichen Patientenalter. Das entspricht dem
 * Broschüren-Beispiel (Vera, 60 J.: Wirbelfraktur 2,9 × Diabetes Typ 1 2,5 =
 * 7,25), das ebenfalls die "Alter 70"-Werte nutzt.
 * Der Parameter age bleibt nur aus API-Kompatibilität erhalten und wird ignoriert.
 */
function getGrad(item, age) {
  return item.g70;
}

/**
 * Schritt-1-Faktor: pro Risikofaktor-Gruppe wird der stärkste Faktor gewählt,
 * dann werden die beiden stärksten Gruppen multipliziert.
 * @param {string} gender 'f' | 'm'
 * @param {number} age
 * @param {object} sel  { itemId: true, ... }
 * @returns {{factor:number, top:Array, n:number}}
 */
function computeS1(gender, age, sel) {
  var byGroup = {};
  RF.forEach(function(grp){
    var picked = grp.items.filter(function(i){ return sel[i.id]; });
    if (picked.length) {
      var best = picked.reduce(function(a, b){
        return getGrad(a, age) >= getGrad(b, age) ? a : b;
      });
      byGroup[grp.group] = { item: best, grad: getGrad(best, age) };
    }
  });
  var arr = Object.keys(byGroup).map(function(k){ return byGroup[k]; })
                  .sort(function(a, b){ return b.grad - a.grad; });
  if (!arr.length) return { factor: 1, top: [], n: 0 };
  if (arr.length === 1) return { factor: arr[0].grad, top: [arr[0]], n: 1 };
  return { factor: arr[0].grad * arr[1].grad, top: [arr[0], arr[1]], n: arr.length };
}

/**
 * Komplettberechnung: welche Therapieschwellen sind erreicht?
 * @returns {{factor, thresholds:{f3,f5,f10}, hit:{t3,t5,t10}, reached:0|3|5|10}}
 */
function evaluate(gender, age, tscore, sel) {
  var s1 = computeS1(gender, age, sel);
  var f10 = getThresh(gender, 10, age, tscore);
  var f5  = getThresh(gender, 5,  age, tscore);
  var f3  = getThresh(gender, 3,  age, tscore);
  var hit10 = s1.factor >= f10, hit5 = s1.factor >= f5, hit3 = s1.factor >= f3;
  return {
    factor: s1.factor,
    top: s1.top,
    n: s1.n,
    thresholds: { f3: f3, f5: f5, f10: f10 },
    hit: { t3: hit3, t5: hit5, t10: hit10 },
    reached: hit10 ? 10 : hit5 ? 5 : hit3 ? 3 : 0
  };
}

// ─── EXPORT (Node + Browser) ───────────────────────────
var DVO = {
  RF: RF, TABLES: TABLES, T_COLS: T_COLS, AGE_ROWS: AGE_ROWS,
  interp: interp, getThresh: getThresh, getGrad: getGrad,
  computeS1: computeS1, evaluate: evaluate
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DVO;          // Node.js / Tests
}
if (typeof window !== 'undefined') {
  window.DVO = DVO;              // Browser
}
