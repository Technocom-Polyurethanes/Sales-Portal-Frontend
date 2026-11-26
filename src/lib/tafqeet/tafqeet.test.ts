import { describe, expect, it } from "vitest"

import { formatAmountInWords } from "./index"

type Row = { amount: number; ar: string; en: string }

const egpRows: Row[] = [
  { amount: 0, ar: "", en: "" },
  { amount: 0.01, ar: "فقط قرش لا غير", en: "One Piastre Only" },
  { amount: 0.02, ar: "فقط قرشان لا غير", en: "Two Piastres Only" },
  { amount: 0.05, ar: "فقط خمسة قروش لا غير", en: "Five Piastres Only" },
  { amount: 0.11, ar: "فقط أحد عشر قرشاً لا غير", en: "Eleven Piastres Only" },
  { amount: 0.5, ar: "فقط خمسون قرشاً لا غير", en: "Fifty Piastres Only" },
  { amount: 0.99, ar: "فقط تسعة وتسعون قرشاً لا غير", en: "Ninety-Nine Piastres Only" },
  { amount: 1, ar: "فقط جنيه مصري لا غير", en: "One Egyptian Pound Only" },
  { amount: 2, ar: "فقط جنيهان مصريان لا غير", en: "Two Egyptian Pounds Only" },
  { amount: 3, ar: "فقط ثلاثة جنيهات مصرية لا غير", en: "Three Egyptian Pounds Only" },
  { amount: 10, ar: "فقط عشرة جنيهات مصرية لا غير", en: "Ten Egyptian Pounds Only" },
  { amount: 11, ar: "فقط أحد عشر جنيهاً مصرياً لا غير", en: "Eleven Egyptian Pounds Only" },
  { amount: 12, ar: "فقط اثنا عشر جنيهاً مصرياً لا غير", en: "Twelve Egyptian Pounds Only" },
  { amount: 19, ar: "فقط تسعة عشر جنيهاً مصرياً لا غير", en: "Nineteen Egyptian Pounds Only" },
  { amount: 20, ar: "فقط عشرون جنيهاً مصرياً لا غير", en: "Twenty Egyptian Pounds Only" },
  { amount: 21, ar: "فقط واحد وعشرون جنيهاً مصرياً لا غير", en: "Twenty-One Egyptian Pounds Only" },
  { amount: 99, ar: "فقط تسعة وتسعون جنيهاً مصرياً لا غير", en: "Ninety-Nine Egyptian Pounds Only" },
  { amount: 100, ar: "فقط مائة جنيه مصري لا غير", en: "One Hundred Egyptian Pounds Only" },
  { amount: 101, ar: "فقط مائة وواحد جنيه مصري لا غير", en: "One Hundred One Egyptian Pounds Only" },
  { amount: 102, ar: "فقط مائة واثنان جنيهان مصريان لا غير", en: "One Hundred Two Egyptian Pounds Only" },
  { amount: 200, ar: "فقط مائتان جنيه مصري لا غير", en: "Two Hundred Egyptian Pounds Only" },
  { amount: 300, ar: "فقط ثلاثمائة جنيه مصري لا غير", en: "Three Hundred Egyptian Pounds Only" },
  { amount: 1000, ar: "فقط ألف جنيه مصري لا غير", en: "One Thousand Egyptian Pounds Only" },
  { amount: 1001, ar: "فقط ألف وواحد جنيه مصري لا غير", en: "One Thousand One Egyptian Pounds Only" },
  { amount: 1002, ar: "فقط ألف واثنان جنيهان مصريان لا غير", en: "One Thousand Two Egyptian Pounds Only" },
  { amount: 2000, ar: "فقط ألفان جنيه مصري لا غير", en: "Two Thousand Egyptian Pounds Only" },
  { amount: 3000, ar: "فقط ثلاثة آلاف جنيه مصري لا غير", en: "Three Thousand Egyptian Pounds Only" },
  { amount: 10000, ar: "فقط عشرة آلاف جنيه مصري لا غير", en: "Ten Thousand Egyptian Pounds Only" },
  { amount: 11000, ar: "فقط أحد عشر ألف جنيه مصري لا غير", en: "Eleven Thousand Egyptian Pounds Only" },
  { amount: 100000, ar: "فقط مائة ألف جنيه مصري لا غير", en: "One Hundred Thousand Egyptian Pounds Only" },
  { amount: 250000, ar: "فقط مائتان وخمسون ألف جنيه مصري لا غير", en: "Two Hundred Fifty Thousand Egyptian Pounds Only" },
  { amount: 1000000, ar: "فقط مليون جنيه مصري لا غير", en: "One Million Egyptian Pounds Only" },
  { amount: 2000000, ar: "فقط مليونان جنيه مصري لا غير", en: "Two Million Egyptian Pounds Only" },
  { amount: 3000000, ar: "فقط ثلاثة ملايين جنيه مصري لا غير", en: "Three Million Egyptian Pounds Only" },
  { amount: 236518.89, ar: "فقط مائتان وستة وثلاثون ألف وخمسمائة وثمانية عشر جنيهاً مصرياً وتسعة وثمانون قرشاً لا غير", en: "Two Hundred Thirty-Six Thousand Five Hundred Eighteen Egyptian Pounds and Eighty-Nine Piastres Only" },
  { amount: 19.99, ar: "فقط تسعة عشر جنيهاً مصرياً وتسعة وتسعون قرشاً لا غير", en: "Nineteen Egyptian Pounds and Ninety-Nine Piastres Only" },
  { amount: 1250000.05, ar: "فقط مليون ومائتان وخمسون ألف جنيه مصري وخمسة قروش لا غير", en: "One Million Two Hundred Fifty Thousand Egyptian Pounds and Five Piastres Only" },
  { amount: 999999.995, ar: "فقط مليون جنيه مصري لا غير", en: "One Million Egyptian Pounds Only" },
]

describe("formatAmountInWords", () => {
  it.each(egpRows)("$amount EGP", ({ amount, ar, en }) => {
    expect(formatAmountInWords(amount, "EGP", "ar")).toBe(ar)
    expect(formatAmountInWords(amount, "EGP", "en")).toBe(en)
  })

  it("renders nothing for zero, NaN and infinite amounts", () => {
    expect(formatAmountInWords(0, "EGP", "ar")).toBe("")
    expect(formatAmountInWords(0, "EGP", "en")).toBe("")
    expect(formatAmountInWords(Number.NaN, "EGP", "ar")).toBe("")
    expect(formatAmountInWords(Number.NaN, "EGP", "en")).toBe("")
    expect(formatAmountInWords(Number.POSITIVE_INFINITY, "EGP", "en")).toBe("")
  })

  it("never leaks NaN or undefined", () => {
    for (const amount of [0.01, 3, 11, 100, 236518.89, Number.NaN]) {
      for (const language of ["ar", "en"] as const) {
        expect(formatAmountInWords(amount, "NOPE", language)).not.toMatch(
          /NaN|undefined/,
        )
      }
    }
  })
})

type CurrencyRow = { code: string; rows: Row[] }

const currencyRows: CurrencyRow[] = [
  {
    code: "USD",
    rows: [
      { amount: 1, ar: "فقط دولار أمريكي لا غير", en: "One Dollar Only" },
      { amount: 2, ar: "فقط دولاران أمريكيان لا غير", en: "Two Dollars Only" },
      { amount: 3, ar: "فقط ثلاثة دولارات أمريكية لا غير", en: "Three Dollars Only" },
      { amount: 11, ar: "فقط أحد عشر دولاراً أمريكياً لا غير", en: "Eleven Dollars Only" },
      { amount: 21, ar: "فقط واحد وعشرون دولاراً أمريكياً لا غير", en: "Twenty-One Dollars Only" },
      { amount: 100, ar: "فقط مائة دولار أمريكي لا غير", en: "One Hundred Dollars Only" },
      { amount: 0.02, ar: "فقط سنتان لا غير", en: "Two Cents Only" },
      { amount: 1250000.05, ar: "فقط مليون ومائتان وخمسون ألف دولار أمريكي وخمسة سنتات لا غير", en: "One Million Two Hundred Fifty Thousand Dollars and Five Cents Only" },
    ],
  },
  {
    code: "EUR",
    rows: [
      { amount: 1, ar: "فقط واحد يورو لا غير", en: "One Euro Only" },
      { amount: 2, ar: "فقط اثنان يورو لا غير", en: "Two Euros Only" },
      { amount: 3, ar: "فقط ثلاثة يورو لا غير", en: "Three Euros Only" },
      { amount: 11, ar: "فقط أحد عشر يورو لا غير", en: "Eleven Euros Only" },
      { amount: 21, ar: "فقط واحد وعشرون يورو لا غير", en: "Twenty-One Euros Only" },
      { amount: 100, ar: "فقط مائة يورو لا غير", en: "One Hundred Euros Only" },
      { amount: 0.02, ar: "فقط سنتان لا غير", en: "Two Cents Only" },
      { amount: 1250000.05, ar: "فقط مليون ومائتان وخمسون ألف يورو وخمسة سنتات لا غير", en: "One Million Two Hundred Fifty Thousand Euros and Five Cents Only" },
    ],
  },
  {
    code: "SAR",
    rows: [
      { amount: 1, ar: "فقط ريال سعودي لا غير", en: "One Saudi Riyal Only" },
      { amount: 2, ar: "فقط ريالان سعوديان لا غير", en: "Two Saudi Riyals Only" },
      { amount: 3, ar: "فقط ثلاثة ريالات سعودية لا غير", en: "Three Saudi Riyals Only" },
      { amount: 11, ar: "فقط أحد عشر ريالاً سعودياً لا غير", en: "Eleven Saudi Riyals Only" },
      { amount: 21, ar: "فقط واحد وعشرون ريالاً سعودياً لا غير", en: "Twenty-One Saudi Riyals Only" },
      { amount: 100, ar: "فقط مائة ريال سعودي لا غير", en: "One Hundred Saudi Riyals Only" },
      { amount: 0.02, ar: "فقط هلتان لا غير", en: "Two Halalas Only" },
      { amount: 1250000.05, ar: "فقط مليون ومائتان وخمسون ألف ريال سعودي وخمسة هللات لا غير", en: "One Million Two Hundred Fifty Thousand Saudi Riyals and Five Halalas Only" },
    ],
  },
  {
    code: "AED",
    rows: [
      { amount: 1, ar: "فقط درهم إماراتي لا غير", en: "One UAE Dirham Only" },
      { amount: 2, ar: "فقط درهمان إماراتيان لا غير", en: "Two UAE Dirhams Only" },
      { amount: 3, ar: "فقط ثلاثة دراهم إماراتية لا غير", en: "Three UAE Dirhams Only" },
      { amount: 11, ar: "فقط أحد عشر درهماً إماراتياً لا غير", en: "Eleven UAE Dirhams Only" },
      { amount: 21, ar: "فقط واحد وعشرون درهماً إماراتياً لا غير", en: "Twenty-One UAE Dirhams Only" },
      { amount: 100, ar: "فقط مائة درهم إماراتي لا غير", en: "One Hundred UAE Dirhams Only" },
      { amount: 0.02, ar: "فقط فلسان لا غير", en: "Two Fils Only" },
      { amount: 1250000.05, ar: "فقط مليون ومائتان وخمسون ألف درهم إماراتي وخمسة فلوس لا غير", en: "One Million Two Hundred Fifty Thousand UAE Dirhams and Five Fils Only" },
    ],
  },
  {
    code: "GBP",
    rows: [
      { amount: 1, ar: "فقط جنيه إسترليني لا غير", en: "One British Pound Only" },
      { amount: 2, ar: "فقط جنيهان إسترلينيان لا غير", en: "Two British Pounds Only" },
      { amount: 3, ar: "فقط ثلاثة جنيهات إسترلينية لا غير", en: "Three British Pounds Only" },
      { amount: 11, ar: "فقط أحد عشر جنيهاً إسترلينياً لا غير", en: "Eleven British Pounds Only" },
      { amount: 21, ar: "فقط واحد وعشرون جنيهاً إسترلينياً لا غير", en: "Twenty-One British Pounds Only" },
      { amount: 100, ar: "فقط مائة جنيه إسترليني لا غير", en: "One Hundred British Pounds Only" },
      { amount: 0.02, ar: "فقط بنسان لا غير", en: "Two Pence Only" },
      { amount: 1250000.05, ar: "فقط مليون ومائتان وخمسون ألف جنيه إسترليني وخمسة بنسات لا غير", en: "One Million Two Hundred Fifty Thousand British Pounds and Five Pence Only" },
    ],
  },
  {
    code: "KWD",
    rows: [
      { amount: 1, ar: "فقط دينار كويتي لا غير", en: "One Kuwaiti Dinar Only" },
      { amount: 2, ar: "فقط ديناران كويتيان لا غير", en: "Two Kuwaiti Dinars Only" },
      { amount: 3, ar: "فقط ثلاثة دنانير كويتية لا غير", en: "Three Kuwaiti Dinars Only" },
      { amount: 11, ar: "فقط أحد عشر ديناراً كويتياً لا غير", en: "Eleven Kuwaiti Dinars Only" },
      { amount: 21, ar: "فقط واحد وعشرون ديناراً كويتياً لا غير", en: "Twenty-One Kuwaiti Dinars Only" },
      { amount: 100, ar: "فقط مائة دينار كويتي لا غير", en: "One Hundred Kuwaiti Dinars Only" },
      { amount: 0.02, ar: "فقط فلسان لا غير", en: "Two Fils Only" },
      { amount: 1250000.05, ar: "فقط مليون ومائتان وخمسون ألف دينار كويتي وخمسة فلوس لا غير", en: "One Million Two Hundred Fifty Thousand Kuwaiti Dinars and Five Fils Only" },
    ],
  },
  {
    code: "QAR",
    rows: [
      { amount: 1, ar: "فقط ريال قطري لا غير", en: "One Qatari Riyal Only" },
      { amount: 2, ar: "فقط ريالان قطريان لا غير", en: "Two Qatari Riyals Only" },
      { amount: 3, ar: "فقط ثلاثة ريالات قطرية لا غير", en: "Three Qatari Riyals Only" },
      { amount: 11, ar: "فقط أحد عشر ريالاً قطرياً لا غير", en: "Eleven Qatari Riyals Only" },
      { amount: 21, ar: "فقط واحد وعشرون ريالاً قطرياً لا غير", en: "Twenty-One Qatari Riyals Only" },
      { amount: 100, ar: "فقط مائة ريال قطري لا غير", en: "One Hundred Qatari Riyals Only" },
      { amount: 0.02, ar: "فقط درهمان لا غير", en: "Two Dirhams Only" },
      { amount: 1250000.05, ar: "فقط مليون ومائتان وخمسون ألف ريال قطري وخمسة دراهم لا غير", en: "One Million Two Hundred Fifty Thousand Qatari Riyals and Five Dirhams Only" },
    ],
  },
  {
    code: "XYZ",
    rows: [
      { amount: 1, ar: "فقط وحدة لا غير", en: "One Unit Only" },
      { amount: 2, ar: "فقط وحدتان لا غير", en: "Two Units Only" },
      { amount: 3, ar: "فقط ثلاث وحدات لا غير", en: "Three Units Only" },
      { amount: 11, ar: "فقط إحدى عشرة وحدةً لا غير", en: "Eleven Units Only" },
      { amount: 21, ar: "فقط واحدة وعشرون وحدةً لا غير", en: "Twenty-One Units Only" },
      { amount: 100, ar: "فقط مائة وحدة لا غير", en: "One Hundred Units Only" },
      { amount: 0.02, ar: "فقط وحدتان لا غير", en: "Two Cents Only" },
      { amount: 1250000.05, ar: "فقط مليون ومائتان وخمسون ألف وحدة وخمس وحدات لا غير", en: "One Million Two Hundred Fifty Thousand Units and Five Cents Only" },
    ],
  },
]

describe("currency grammar", () => {
  it.each(currencyRows)("$code", ({ code, rows }) => {
    for (const row of rows) {
      expect(formatAmountInWords(row.amount, code, "ar")).toBe(row.ar)
      expect(formatAmountInWords(row.amount, code, "en")).toBe(row.en)
    }
  })
})
