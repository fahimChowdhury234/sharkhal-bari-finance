import type { ExpenseRecord, IncomeRecord, MemberRecord } from '~/types/finance'

const MONTH_LABELS = [
  'Sep 2025',
  'Oct 2025',
  'Nov 2025',
  'Dec 2025',
  'Jan 2026',
  'Feb 2026',
  'Mar 2026',
  'Apr 2026',
  'May 2026',
  'Jun 2026',
  'Jul 2026',
  'Aug 2026'
]

const MONTH_DATES = [
  '2025-09-01',
  '2025-10-01',
  '2025-11-01',
  '2025-12-01',
  '2026-01-01',
  '2026-02-01',
  '2026-03-01',
  '2026-04-01',
  '2026-05-01',
  '2026-06-01',
  '2026-07-01',
  '2026-08-01'
]

function now() {
  return '2026-05-02T00:00:00.000Z'
}

function cleanText(value: string | undefined) {
  return (value ?? '').replace(/\u2060/g, '').trim()
}

function parseAmount(value: string | number | undefined) {
  if (typeof value === 'number') {
    return value
  }

  const cleaned = cleanText(value)
    .replace(/[,\s]/g, '')
    .replace(/[০-৯]/g, (digit) => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)))

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

function monthlyDueFromAnnual(annualDue: number) {
  return annualDue > 0 ? Math.round(annualDue / 12) : 0
}

function paymentSummary(months: string[]) {
  return months
    .map((value, index) => {
      const cleaned = cleanText(value)
      if (!cleaned || cleaned === '-') {
        return ''
      }

      return `${MONTH_LABELS[index]}: ${cleaned}`
    })
    .filter(Boolean)
    .join(', ')
}

function lastPaymentDate(months: string[]) {
  const paidIndexes = months
    .map((value, index) => ({ value: cleanText(value), index }))
    .filter((entry) => entry.value && entry.value !== '-')

  if (paidIndexes.length) {
    const month = paidIndexes[paidIndexes.length - 1].index
    return MONTH_DATES[month] || '2025-09-01'
  }

  return '2025-09-01'
}

function repeatMonths(value: string, count = 12) {
  return Array.from({ length: count }, () => value)
}

type ImportedMemberRow = {
  name: string
  phone: string
  annualDue: string
  paidAmount: string
  collector: string
  months: string[]
}

const importedMemberRows: ImportedMemberRow[] = [
  {
    name: 'মো. জাহিদুল হাসান চৌধুরী (সাগর)',
    phone: '+966-53-959-33',
    annualDue: '১,২০০',
    paidAmount: '১২০০',
    collector: 'Fahim (Bkash)',
    months: repeatMonths('১০০', 12)
  },
  {
    name: 'আমির হোসেন',
    phone: '',
    annualDue: '৪,০০০',
    paidAmount: '২,০০০',
    collector: 'জামান',
    months: []
  },
  {
    name: 'তানভীর হাছান চৌধুরী (বাবু)',
    phone: '+45 71 65 64 98',
    annualDue: '৪,৮০০',
    paidAmount: '৪,০০০',
    collector: 'Fahim (Bkash)',
    months: []
  },
  {
    name: 'তারেক হাসান চৌধুরী (হৃদয়)',
    phone: '+61 492 922 235',
    annualDue: '৩,০০০',
    paidAmount: '১,০০০',
    collector: 'জামান',
    months: []
  },
  {
    name: 'ফাহিম হোসেন',
    phone: '01736-342028',
    annualDue: '১,২০০',
    paidAmount: '',
    collector: '',
    months: []
  },
  {
    name: 'নুরুন্নবী চৌধুরী (হাছিব)',
    phone: '01712-754752',
    annualDue: '৫,০০০',
    paidAmount: '',
    collector: '',
    months: []
  },
  {
    name: 'আসিব চৌধুরী (পাপন)',
    phone: '01913191817',
    annualDue: '২,৫০০',
    paidAmount: '২,৫০০',
    collector: 'জামান',
    months: repeatMonths('-', 12)
  },
  {
    name: 'জসিম উদ্দিন',
    phone: '01917-324233',
    annualDue: '১,০০০',
    paidAmount: '১,০০০',
    collector: 'Fahim',
    months: repeatMonths('-', 12)
  },
  {
    name: 'শাহ মুহা: খালেকুজ্জামান চৌধুরী (জামান)',
    phone: '01716-088745',
    annualDue: '২,০০০',
    paidAmount: '১,০০০',
    collector: 'জামান',
    months: []
  },
  {
    name: 'তাশহুদ আমিন (রাফি)',
    phone: '01785-640978',
    annualDue: '',
    paidAmount: '',
    collector: '',
    months: []
  },
  {
    name: 'মো. নাজমুস সাকিব',
    phone: '01734-361601',
    annualDue: '',
    paidAmount: '',
    collector: '',
    months: []
  },
  {
    name: 'মো. এমদাদুল হক (সুজন)',
    phone: '01845-662627',
    annualDue: '১,২০০',
    paidAmount: '',
    collector: '',
    months: []
  },
  {
    name: 'মো. মেহেদী হাসান (সুমন)',
    phone: '01533-701393',
    annualDue: '',
    paidAmount: '',
    collector: '',
    months: []
  },
  {
    name: 'এম এ এ নোমান (তুহিন)',
    phone: '01778-004123',
    annualDue: '',
    paidAmount: '',
    collector: '',
    months: []
  },
  {
    name: 'মো. আল আমিন (তুষার)',
    phone: '01795-418758',
    annualDue: '',
    paidAmount: '',
    collector: '',
    months: []
  },
  {
    name: 'মো. জুবায়ের হোসেন চৌধুরী (লিমন)',
    phone: '01610-210084',
    annualDue: '',
    paidAmount: '',
    collector: '',
    months: []
  },
  {
    name: 'সাবের হোসেন চৌধুরী',
    phone: '01890-512680',
    annualDue: '১,২০০',
    paidAmount: '১০০',
    collector: 'Fahim (Bkash)',
    months: ['১০০', '১০০']
  },
  {
    name: 'মিজান চৌধুরী',
    phone: '01762-178383',
    annualDue: '',
    paidAmount: '',
    collector: '',
    months: []
  },
  {
    name: 'আনিসুর রহমান',
    phone: '01673-787519',
    annualDue: '১২০০',
    paidAmount: '',
    collector: '',
    months: []
  },
  {
    name: 'আরিফ হোসেন',
    phone: '+1 (718) 909-1275',
    annualDue: '২৫,০০০',
    paidAmount: '২৫০০০',
    collector: 'জামান',
    months: repeatMonths('-', 12)
  },
  {
    name: 'রবি চৌধুর',
    phone: '',
    annualDue: '১,২০০',
    paidAmount: '৬০০',
    collector: 'Fahim',
    months: ['১০০', '১০০', '১০০', '১০০', '১০০', '১০০', '১০০', '১০০', '১০০']
  },
  {
    name: 'হাছিনা আকতার',
    phone: '',
    annualDue: '৫,০০০',
    paidAmount: '',
    collector: 'Fahim',
    months: []
  },
  {
    name: 'বাড়ির ফান্ডে পূর্বের জমা',
    phone: '',
    annualDue: '২,০০০',
    paidAmount: '২০০০',
    collector: 'Fahim',
    months: []
  },
  {
    name: 'তোফায়েল চৌধুরী',
    phone: '',
    annualDue: '২,৪০০',
    paidAmount: '১,০০০',
    collector: 'Fahim',
    months: ['২,০০', '২,০০', '২,০০', '২,০০', '২,০০']
  },
  {
    name: 'তৌহিদ চৌধুরী',
    phone: '',
    annualDue: '',
    paidAmount: '৩৭১',
    collector: 'জামান',
    months: []
  }
]

function makeMemberRecord(row: ImportedMemberRow, index: number): MemberRecord {
  const annualDue = parseAmount(row.annualDue)
  const paidAmount = parseAmount(row.paidAmount)
  const summary = paymentSummary(row.months)

  return {
    id: `imported-member-${index + 1}`,
    name: cleanText(row.name),
    phone: cleanText(row.phone),
    email: '',
    address: '',
    joinDate: '2025-09-01',
    monthlyDue: monthlyDueFromAnnual(annualDue),
    status: 'active',
    notes: summary
      ? `Imported from the member workbook. Collector: ${cleanText(row.collector) || 'N/A'}. ${summary}`
      : `Imported from the member workbook. Collector: ${cleanText(row.collector) || 'N/A'}.`,
    annualDue: annualDue || undefined,
    paidAmount: paidAmount || undefined,
    collector: cleanText(row.collector) || undefined,
    monthlyPayments: row.months.length ? row.months : undefined,
    createdAt: now(),
    updatedAt: now()
  }
}

function makeIncomeRecord(row: ImportedMemberRow, index: number): IncomeRecord | null {
  const paidAmount = parseAmount(row.paidAmount)
  if (!paidAmount) {
    return null
  }

  const annualDue = parseAmount(row.annualDue)
  const summary = paymentSummary(row.months)

  return {
    id: `imported-income-${index + 1}`,
    source: cleanText(row.name),
    category: 'Annual contribution',
    amount: paidAmount,
    receivedAt: lastPaymentDate(row.months),
    receivedBy: cleanText(row.collector) || 'Spreadsheet import',
    notes: summary
      ? `Imported from the member workbook. Annual due: ${annualDue || paidAmount}. ${summary}`
      : `Imported from the member workbook. Annual due: ${annualDue || paidAmount}.`,
    memberName: cleanText(row.name),
    annualDue: annualDue || undefined,
    collector: cleanText(row.collector) || undefined,
    monthlyPayments: row.months.length ? row.months : undefined,
    createdAt: now(),
    updatedAt: now()
  }
}

type ImportedExpenseRow = {
  description: string
  amount: string
  dateSerial: number
  source: string
}

const importedExpenseRows: ImportedExpenseRow[] = [
  { description: 'সীল তৈরি', amount: '৪৮০', dateSerial: 45919, source: 'Fahim' },
  { description: 'ফটোকপি', amount: '৬০', dateSerial: 45919, source: 'Fahim' },
  { description: 'তোহা জ্যাঠার মিলাদে মিষ্টির খরচ', amount: '৬০০', dateSerial: 45929, source: 'Fahim' },
  { description: 'মিলাদে হুজুর কে দিলাম', amount: '১০০', dateSerial: 45929, source: 'Fahim' },
  { description: 'হিরা আপুর বিয়ের গিফট বাবদ খরচ', amount: '১২০০', dateSerial: 45948, source: 'Fahim' },
  { description: 'রাস্তার কাজের জন্য মোস্তফা ভাই কে দিলাম', amount: '৫০০', dateSerial: 46041, source: 'Fahim' },
  { description: 'লাইট, তাড়, দড়ি ইত্যাদি বাবদ', amount: '৮৯০', dateSerial: 46067, source: 'Fahim' },
  { description: 'ফেব্রুয়ারি মাসের বিল বাবদ', amount: '৪০', dateSerial: 46081, source: 'Fahim' },
  { description: 'মার্চ মাসের বিল বাবদ', amount: '২৭২', dateSerial: 46110, source: 'Fahim' },
  { description: 'ব্রিজের দক্ষিণ পাড়ের রাস্তা মেরামত বাবদ শামসল কাকা কে দিলাম - ১০০০', amount: '১০০০', dateSerial: 46110, source: 'Fahim' },
  { description: 'এপ্রিল মাসেন বিল বাবদ', amount: '১১৩', dateSerial: 46136, source: 'Fahim' }
]

function excelSerialToDate(serial: number) {
  const base = new Date(Date.UTC(1899, 11, 30))
  const result = new Date(base.getTime() + serial * 24 * 60 * 60 * 1000)
  return result.toISOString().slice(0, 10)
}

function makeExpenseRecord(row: ImportedExpenseRow, index: number): ExpenseRecord {
  return {
    id: `imported-expense-${index + 1}`,
    category: cleanText(row.description),
    amount: parseAmount(row.amount),
    paidAt: excelSerialToDate(row.dateSerial),
    paidTo: cleanText(row.source),
    method: 'Cash',
    notes: 'Imported from the expense workbook.',
    sourceFile: 'সরখাল ওলিভ তরুণ সংঘ খরচের তালিকা.xlsx',
    createdAt: now(),
    updatedAt: now()
  }
}

export const financeSeed = {
  members: [
    ...importedMemberRows.map((row, index) => makeMemberRecord(row, index))
  ] satisfies MemberRecord[],
  income: [
    ...importedMemberRows.map((row, index) => makeIncomeRecord(row, index)).filter((value): value is IncomeRecord => Boolean(value))
  ] satisfies IncomeRecord[],
  expense: [
    ...importedExpenseRows.map((row, index) => makeExpenseRecord(row, index))
  ] satisfies ExpenseRecord[]
}
