export type CollectionName = 'members' | 'income' | 'expense'

export interface MemberRecord {
  id: string
  name: string
  phone: string
  email: string
  address: string
  joinDate: string
  monthlyDue: number
  status: 'active' | 'inactive'
  notes: string
  annualDue?: number
  paidAmount?: number
  collector?: string
  monthlyPayments?: string[]
  createdAt: string
  updatedAt: string
}

export interface IncomeRecord {
  id: string
  source: string
  category: string
  amount: number
  receivedAt: string
  receivedBy: string
  notes: string
  memberName?: string
  annualDue?: number
  collector?: string
  monthlyPayments?: string[]
  createdAt: string
  updatedAt: string
}

export interface ExpenseRecord {
  id: string
  category: string
  amount: number
  paidAt: string
  paidTo: string
  method: string
  notes: string
  sourceFile?: string
  createdAt: string
  updatedAt: string
}
