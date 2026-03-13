'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { Search, Building2, UserRound, X, Plus } from 'lucide-react'
import Link from 'next/link'

interface ClientResult {
  id: string
  type: 'company' | 'individual'
  displayName: string
  companyName: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  address: string | null
  addressComplement: string | null
  postalCode: string | null
  city: string | null
  country: string
  siren: string | null
  vatNumber: string | null
}

interface ClientSelectorProps {
  selectedClient: ClientResult | null
  onSelect: (client: ClientResult) => void
  onClear: () => void
}

export function ClientSelector({ selectedClient, onSelect, onClear }: ClientSelectorProps) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<ClientResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!search.trim()) {
      setResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const { data } = await api.get<{ clients: ClientResult[] }>(
        `/clients?search=${encodeURIComponent(search)}`
      )
      if (data?.clients) {
        setResults(data.clients)
      }
      setLoading(false)
      setOpen(true)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (selectedClient) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              selectedClient.type === 'company' ? 'bg-blue-500/10' : 'bg-green-500/10'
            }`}>
              {selectedClient.type === 'company' ? (
                <Building2 className="h-4 w-4 text-blue-500" />
              ) : (
                <UserRound className="h-4 w-4 text-green-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{selectedClient.displayName}</p>
              <Badge variant="muted" className="text-[10px]">
                {selectedClient.type === 'company' ? 'Pro' : 'Part.'}
              </Badge>
            </div>
          </div>
          <button
            onClick={onClear}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {selectedClient.email && (
          <p className="text-xs text-muted-foreground">{selectedClient.email}</p>
        )}
        {selectedClient.address && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedClient.address}
            {selectedClient.postalCode && `, ${selectedClient.postalCode}`}
            {selectedClient.city && ` ${selectedClient.city}`}
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={onClear}
        >
          Changer de client
        </Button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => search.trim() && setOpen(true)}
          className="pl-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner />
          </div>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border bg-card shadow-lg max-h-64 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {search.trim() ? 'Aucun client trouve' : 'Tapez pour rechercher'}
              </p>
            </div>
          ) : (
            <div className="p-1">
              {results.map((client) => (
                <button
                  key={client.id}
                  onClick={() => {
                    onSelect(client)
                    setSearch('')
                    setOpen(false)
                  }}
                  className="w-full flex items-center gap-3 rounded-lg p-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    client.type === 'company' ? 'bg-blue-500/10' : 'bg-green-500/10'
                  }`}>
                    {client.type === 'company' ? (
                      <Building2 className="h-4 w-4 text-blue-500" />
                    ) : (
                      <UserRound className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {client.displayName}
                      </p>
                      <Badge variant="muted" className="text-[10px] shrink-0">
                        {client.type === 'company' ? 'Pro' : 'Part.'}
                      </Badge>
                    </div>
                    {client.email && (
                      <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-border p-2">
            <Link
              href="/dashboard/clients/create"
              className="flex items-center gap-2 rounded-lg p-2 text-sm text-primary hover:bg-primary/5 transition-colors"
            >
              <Plus className="h-4 w-4" /> Creer un nouveau client
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
