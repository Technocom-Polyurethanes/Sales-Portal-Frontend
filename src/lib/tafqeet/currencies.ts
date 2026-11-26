export type ArabicForms = {
  one: string
  dual: string
  plural: string
  accusative: string
}

type CurrencyDefinition = {
  enMajor: readonly [string, string]
  enMinor: readonly [string, string]
  arFeminine: boolean
  arMinorFeminine?: boolean
  arMajor: ArabicForms
  arMinor: ArabicForms
}

const DEFINITIONS: Record<string, CurrencyDefinition> = {
  EGP: {
    enMajor: ["Egyptian Pound", "Egyptian Pounds"],
    enMinor: ["Piastre", "Piastres"],
    arFeminine: false,
    arMajor: {
      one: "جنيه مصري",
      dual: "جنيهان مصريان",
      plural: "جنيهات مصرية",
      accusative: "جنيهاً مصرياً",
    },
    arMinor: {
      one: "قرش",
      dual: "قرشان",
      plural: "قروش",
      accusative: "قرشاً",
    },
  },
  USD: {
    enMajor: ["Dollar", "Dollars"],
    enMinor: ["Cent", "Cents"],
    arFeminine: false,
    arMajor: {
      one: "دولار أمريكي",
      dual: "دولاران أمريكيان",
      plural: "دولارات أمريكية",
      accusative: "دولاراً أمريكياً",
    },
    arMinor: {
      one: "سنت",
      dual: "سنتان",
      plural: "سنتات",
      accusative: "سنتاً",
    },
  },
  EUR: {
    enMajor: ["Euro", "Euros"],
    enMinor: ["Cent", "Cents"],
    arFeminine: false,
    arMajor: {
      one: "يورو",
      dual: "يورو",
      plural: "يورو",
      accusative: "يورو",
    },
    arMinor: {
      one: "سنت",
      dual: "سنتان",
      plural: "سنتات",
      accusative: "سنتاً",
    },
  },
  SAR: {
    enMajor: ["Saudi Riyal", "Saudi Riyals"],
    enMinor: ["Halala", "Halalas"],
    arFeminine: false,
    arMinorFeminine: true,
    arMajor: {
      one: "ريال سعودي",
      dual: "ريالان سعوديان",
      plural: "ريالات سعودية",
      accusative: "ريالاً سعودياً",
    },
    arMinor: {
      one: "هللة",
      dual: "هلتان",
      plural: "هللات",
      accusative: "هللةً",
    },
  },
  AED: {
    enMajor: ["UAE Dirham", "UAE Dirhams"],
    enMinor: ["Fil", "Fils"],
    arFeminine: false,
    arMajor: {
      one: "درهم إماراتي",
      dual: "درهمان إماراتيان",
      plural: "دراهم إماراتية",
      accusative: "درهماً إماراتياً",
    },
    arMinor: {
      one: "فلس",
      dual: "فلسان",
      plural: "فلوس",
      accusative: "فلساً",
    },
  },
  GBP: {
    enMajor: ["British Pound", "British Pounds"],
    enMinor: ["Penny", "Pence"],
    arFeminine: false,
    arMajor: {
      one: "جنيه إسترليني",
      dual: "جنيهان إسترلينيان",
      plural: "جنيهات إسترلينية",
      accusative: "جنيهاً إسترلينياً",
    },
    arMinor: {
      one: "بنس",
      dual: "بنسان",
      plural: "بنسات",
      accusative: "بنساً",
    },
  },
  KWD: {
    enMajor: ["Kuwaiti Dinar", "Kuwaiti Dinars"],
    enMinor: ["Fil", "Fils"],
    arFeminine: false,
    arMajor: {
      one: "دينار كويتي",
      dual: "ديناران كويتيان",
      plural: "دنانير كويتية",
      accusative: "ديناراً كويتياً",
    },
    arMinor: {
      one: "فلس",
      dual: "فلسان",
      plural: "فلوس",
      accusative: "فلساً",
    },
  },
  QAR: {
    enMajor: ["Qatari Riyal", "Qatari Riyals"],
    enMinor: ["Dirham", "Dirhams"],
    arFeminine: false,
    arMajor: {
      one: "ريال قطري",
      dual: "ريالان قطريان",
      plural: "ريالات قطرية",
      accusative: "ريالاً قطرياً",
    },
    arMinor: {
      one: "درهم",
      dual: "درهمان",
      plural: "دراهم",
      accusative: "درهماً",
    },
  },
}

const GENERIC_FORMS: ArabicForms = {
  one: "وحدة",
  dual: "وحدتان",
  plural: "وحدات",
  accusative: "وحدةً",
}

const FALLBACK: CurrencyDefinition = {
  enMajor: ["Unit", "Units"],
  enMinor: ["Cent", "Cents"],
  arFeminine: true,
  arMajor: GENERIC_FORMS,
  arMinor: GENERIC_FORMS,
}

export function currencyDefinition(code: string): CurrencyDefinition {
  return typeof code === "string"
    ? DEFINITIONS[code.toUpperCase()] ?? FALLBACK
    : FALLBACK
}
