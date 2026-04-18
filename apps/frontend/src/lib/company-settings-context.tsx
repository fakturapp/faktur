'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { api } from '@/lib/api'

export interface Company {
  id: string
  legalName: string
  tradeName: string | null
  siren: string | null
  siret: string | null
  vatNumber: string | null
  legalForm: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  postalCode: string | null
  country: string
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  iban: string | null
  bic: string | null
  bankName: string | null
  paymentConditions: string | null
  currency: string
}

export interface BankAccountItem {
  id: string
  label: string
  bankName: string | null
  ibanMasked: string | null
  bicMasked: string | null
  isDefault: boolean
}

export interface BankAccountForm {
  label: string
  bankName: string
  iban: string
  bic: string
  isDefault: boolean
}

export interface CompanyForm {
  legalName: string
  tradeName: string
  siren: string
  siret: string
  vatNumber: string
  legalForm: string
  addressLine1: string
  addressLine2: string
  city: string
  postalCode: string
  phone: string
  email: string
  website: string
}

export interface PaymentForm {
  paymentConditions: string
  currency: string
}

interface CompanySettingsContextType {
  company: Company | null
  loading: boolean
  noCompany: boolean
  logoUrl: string | null
  form: CompanyForm
  paymentForm: PaymentForm
  bankAccounts: BankAccountItem[]
  bankLoading: boolean
  paymentHasChanges: boolean
  paymentSaving: boolean
  paymentSaveError: string | null
  setCompany: (c: Company | null) => void
  setNoCompany: (v: boolean) => void
  setLogoUrl: (url: string | null) => void
  setForm: React.Dispatch<React.SetStateAction<CompanyForm>>
  setPaymentForm: React.Dispatch<React.SetStateAction<PaymentForm>>
  savePayment: () => Promise<boolean>
  resetPayment: () => void
  loadBankAccounts: () => Promise<void>
}

const defaultForm: CompanyForm = {
  legalName: '', tradeName: '', siren: '', siret: '', vatNumber: '', legalForm: '',
  addressLine1: '', addressLine2: '', city: '', postalCode: '', phone: '', email: '', website: '',
}

const defaultPaymentForm: PaymentForm = {
  paymentConditions: '', currency: 'EUR',
}

const CompanySettingsContext = createContext<CompanySettingsContextType>({
  company: null, loading: true, noCompany: false, logoUrl: null,
  form: defaultForm, paymentForm: defaultPaymentForm,
  bankAccounts: [], bankLoading: false,
  paymentHasChanges: false, paymentSaving: false, paymentSaveError: null,
  setCompany: () => {}, setNoCompany: () => {}, setLogoUrl: () => {},
  setForm: () => {}, setPaymentForm: () => {},
  savePayment: async () => false, resetPayment: () => {},
  loadBankAccounts: async () => {},
})

export function useCompanySettings() {
  return useContext(CompanySettingsContext)
}

export function CompanySettingsProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [noCompany, setNoCompany] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [form, setForm] = useState<CompanyForm>(defaultForm)
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(defaultPaymentForm)
  const [savedPaymentForm, setSavedPaymentForm] = useState<PaymentForm>(defaultPaymentForm)
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [paymentSaveError, setPaymentSaveError] = useState<string | null>(null)
  const paymentFormRef = useRef(paymentForm)
  paymentFormRef.current = paymentForm
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([])
  const [bankLoading, setBankLoading] = useState(false)

  const paymentHasChanges = JSON.stringify(paymentForm) !== JSON.stringify(savedPaymentForm)

  const loadBankAccounts = useCallback(async () => {
    setBankLoading(true)
    const { data } = await api.get<{ bankAccounts: BankAccountItem[] }>('/company/bank-accounts')
    if (data?.bankAccounts) setBankAccounts(data.bankAccounts)
    setBankLoading(false)
  }, [])

  useEffect(() => {
    api.get<{ company: Company }>('/company').then(({ data }) => {
      if (data?.company) {
        setCompany(data.company)
        setLogoUrl(data.company.logoUrl)
        loadBankAccounts()
        setForm({
          legalName: data.company.legalName || '',
          tradeName: data.company.tradeName || '',
          siren: data.company.siren || '',
          siret: data.company.siret || '',
          vatNumber: data.company.vatNumber || '',
          legalForm: data.company.legalForm || '',
          addressLine1: data.company.addressLine1 || '',
          addressLine2: data.company.addressLine2 || '',
          city: data.company.city || '',
          postalCode: data.company.postalCode || '',
          phone: data.company.phone || '',
          email: data.company.email || '',
          website: data.company.website || '',
        })
        const initialPaymentForm: PaymentForm = {
          paymentConditions: data.company.paymentConditions || '',
          currency: data.company.currency || 'EUR',
        }
        setPaymentForm(initialPaymentForm)
        setSavedPaymentForm(initialPaymentForm)
      } else {
        setNoCompany(true)
      }
      setLoading(false)
    })
  }, [loadBankAccounts])

  const savePayment = useCallback(async () => {
    setPaymentSaving(true)
    setPaymentSaveError(null)
    const next = paymentFormRef.current
    const { error } = await api.put('/company', {
      paymentConditions: next.paymentConditions,
      currency: next.currency,
    })
    setPaymentSaving(false)
    if (error) {
      setPaymentSaveError(error)
      return false
    }
    setSavedPaymentForm({ ...next })
    return true
  }, [])

  const resetPayment = useCallback(() => {
    setPaymentForm({ ...savedPaymentForm })
    setPaymentSaveError(null)
  }, [savedPaymentForm])

  return (
    <CompanySettingsContext.Provider value={{
      company, loading, noCompany, logoUrl, form, paymentForm, bankAccounts, bankLoading,
      paymentHasChanges, paymentSaving, paymentSaveError,
      setCompany, setNoCompany, setLogoUrl, setForm, setPaymentForm,
      savePayment, resetPayment, loadBankAccounts,
    }}>
      {children}
    </CompanySettingsContext.Provider>
  )
}
