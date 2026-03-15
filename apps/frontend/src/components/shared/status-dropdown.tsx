'use client'

import { useState, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'
import {
  FileEdit,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  AlertTriangle,
  CreditCard,
} from 'lucide-react'

interface StatusOption {
  value: string
  label: string
  color: string
  bgColor: string
  icon: ReactNode
}

interface StatusDropdownProps {
  id: string
  currentStatus: string
  options: StatusOption[]
  endpoint: 'quotes' | 'invoices'
  onStatusChange: (id: string, newStatus: string) => void
  fullWidth?: boolean
}

export function StatusDropdown({ id, currentStatus, options, endpoint, onStatusChange, fullWidth }: StatusDropdownProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const current = options.find((o) => o.value === currentStatus) || options[0]

  async function handleChange(newStatus: string) {
    if (newStatus === currentStatus || loading) return
    setLoading(true)
    const { error } = await api.patch(`/${endpoint}/${id}/status`, { status: newStatus })
    setLoading(false)
    if (error) {
      toast(error, 'error')
      return
    }
    onStatusChange(id, newStatus)
  }

  return (
    <div onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
      <Dropdown
        align="left"
        trigger={
          fullWidth ? (
            <div className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border text-sm font-semibold cursor-pointer transition-all shadow-sm hover:shadow ${current.color} ${current.bgColor} border-current/20 ${loading ? 'animate-pulse' : ''}`}>
              {loading ? <Spinner className="h-4 w-4" /> : current.icon}
              {current.label}
            </div>
          ) : (
            <Badge
              variant="muted"
              className={`text-[10px] shrink-0 cursor-pointer hover:opacity-80 transition-opacity ${current.color} ${current.bgColor} ${loading ? 'animate-pulse' : ''}`}
            >
              <span className="flex items-center gap-1">
                {current.icon}
                {current.label}
              </span>
            </Badge>
          )
        }
        className="min-w-[180px]"
      >
        {options.map((opt) => (
          <DropdownItem
            key={opt.value}
            onClick={() => handleChange(opt.value)}
            className={opt.value === currentStatus ? 'opacity-50' : ''}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </DropdownItem>
        ))}
      </Dropdown>
    </div>
  )
}

export const quoteStatusOptions: StatusOption[] = [
  { value: 'draft', label: 'Brouillon', color: 'text-zinc-400', bgColor: 'bg-zinc-400/10', icon: <FileEdit className="h-3.5 w-3.5" /> },
  { value: 'sent', label: 'Envoyé', color: 'text-blue-400', bgColor: 'bg-blue-400/10', icon: <Send className="h-3.5 w-3.5" /> },
  { value: 'accepted', label: 'Accepté', color: 'text-green-400', bgColor: 'bg-green-400/10', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  { value: 'refused', label: 'Refusé', color: 'text-red-400', bgColor: 'bg-red-400/10', icon: <XCircle className="h-3.5 w-3.5" /> },
  { value: 'expired', label: 'Expiré', color: 'text-amber-400', bgColor: 'bg-amber-400/10', icon: <Clock className="h-3.5 w-3.5" /> },
]

export const invoiceStatusOptions: StatusOption[] = [
  { value: 'draft', label: 'Brouillon', color: 'text-zinc-400', bgColor: 'bg-zinc-400/10', icon: <FileEdit className="h-3.5 w-3.5" /> },
  { value: 'sent', label: 'Envoyée', color: 'text-blue-400', bgColor: 'bg-blue-400/10', icon: <Send className="h-3.5 w-3.5" /> },
  { value: 'paid', label: 'Payée', color: 'text-green-400', bgColor: 'bg-green-400/10', icon: <CreditCard className="h-3.5 w-3.5" /> },
  { value: 'overdue', label: 'En retard', color: 'text-red-400', bgColor: 'bg-red-400/10', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  { value: 'cancelled', label: 'Annulée', color: 'text-orange-400', bgColor: 'bg-orange-400/10', icon: <Ban className="h-3.5 w-3.5" /> },
]
