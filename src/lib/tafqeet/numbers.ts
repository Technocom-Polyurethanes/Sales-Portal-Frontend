const EN_ONES = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
]

const EN_TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
]

const EN_SCALES = [
  [1_000_000_000, "Billion"],
  [1_000_000, "Million"],
  [1_000, "Thousand"],
] as const

function englishUnderHundred(value: number): string {
  if (value < 20) return EN_ONES[value]!
  const tens = EN_TENS[Math.floor(value / 10)]!
  const ones = value % 10
  return ones ? `${tens}-${EN_ONES[ones]!}` : tens
}

function englishUnderThousand(value: number): string {
  const hundreds = Math.floor(value / 100)
  const remainder = value % 100
  if (!hundreds) return englishUnderHundred(remainder)
  if (!remainder) return `${EN_ONES[hundreds]!} Hundred`
  return `${EN_ONES[hundreds]!} Hundred ${englishUnderHundred(remainder)}`
}

export function englishNumber(value: number): string {
  if (value === 0) return "Zero"
  const parts: string[] = []
  for (const [scale, name] of EN_SCALES) {
    const group = Math.floor(value / scale) % 1000
    if (group) parts.push(`${englishUnderThousand(group)} ${name}`)
  }
  const remainder = value % 1000
  if (remainder) parts.push(englishUnderThousand(remainder))
  return parts.join(" ")
}

const AR_ONES_M = [
  "",
  "واحد",
  "اثنان",
  "ثلاثة",
  "أربعة",
  "خمسة",
  "ستة",
  "سبعة",
  "ثمانية",
  "تسعة",
  "عشرة",
]

const AR_ONES_F = [
  "",
  "واحدة",
  "اثنتان",
  "ثلاث",
  "أربع",
  "خمس",
  "ست",
  "سبع",
  "ثمان",
  "تسع",
  "عشر",
]

const AR_TEENS_M = [
  "أحد عشر",
  "اثنا عشر",
  "ثلاثة عشر",
  "أربعة عشر",
  "خمسة عشر",
  "ستة عشر",
  "سبعة عشر",
  "ثمانية عشر",
  "تسعة عشر",
]

const AR_TEENS_F = [
  "إحدى عشرة",
  "اثنتا عشرة",
  "ثلاث عشرة",
  "أربع عشرة",
  "خمس عشرة",
  "ست عشرة",
  "سبع عشرة",
  "ثمان عشرة",
  "تسع عشرة",
]

const AR_TENS = [
  "عشرون",
  "ثلاثون",
  "أربعون",
  "خمسون",
  "ستون",
  "سبعون",
  "ثمانون",
  "تسعون",
]

const AR_HUNDREDS = [
  "",
  "مائة",
  "مائتان",
  "ثلاثمائة",
  "أربعمائة",
  "خمسمائة",
  "ستمائة",
  "سبعمائة",
  "ثمانمائة",
  "تسعمائة",
]

const AR_SCALES = [
  { value: 1_000_000_000, one: "مليار", dual: "ملياران", plural: "مليارات" },
  { value: 1_000_000, one: "مليون", dual: "مليونان", plural: "ملايين" },
  { value: 1_000, one: "ألف", dual: "ألفان", plural: "آلاف" },
] as const

export function arabicUnderHundred(value: number, feminine = false): string {
  if (value < 11) return (feminine ? AR_ONES_F : AR_ONES_M)[value]!
  if (value < 20) return (feminine ? AR_TEENS_F : AR_TEENS_M)[value - 11]!
  const tens = Math.floor(value / 10)
  const ones = value % 10
  const tensWord = AR_TENS[tens - 2]!
  if (!ones) return tensWord
  return `${(feminine ? AR_ONES_F : AR_ONES_M)[ones]!} و${tensWord}`
}

export function arabicUnderThousand(value: number, feminine = false): string {
  const hundreds = Math.floor(value / 100)
  const remainder = value % 100
  if (!hundreds) return arabicUnderHundred(remainder, feminine)
  if (!remainder) return AR_HUNDREDS[hundreds]!
  return `${AR_HUNDREDS[hundreds]} و${arabicUnderHundred(remainder, feminine)}`
}

export function arabicNumber(value: number, feminine = false): string {
  const parts: string[] = []
  for (const scale of AR_SCALES) {
    const group = Math.floor(value / scale.value) % 1000
    if (!group) continue
    const noun =
      group === 1
        ? scale.one
        : group === 2
          ? scale.dual
          : group <= 10
            ? scale.plural
            : scale.one
    const words = group <= 2 ? "" : `${arabicUnderThousand(group)} `
    parts.push(`${words}${noun}`)
  }
  const remainder = value % 1000
  if (remainder) parts.push(arabicUnderThousand(remainder, feminine))
  return parts.join(" و")
}
