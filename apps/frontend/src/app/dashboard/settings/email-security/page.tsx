'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { api } from '@/lib/api'
import {
  ShieldAlert, Plus, Trash2, Search, CheckCircle2, XCircle, Clock,
  ChevronLeft, ChevronRight, Shield,
} from 'lucide-react'

interface BlocklistEntry {
  id: string
  domain: string
  action: 'block' | 'allow'
  reason: string | null
  createdAt: string
}

interface Appeal {
  id: string
  email: string
  domain: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  adminNote: string | null
  ipAddress: string | null
  reviewedAt: string | null
  createdAt: string
}

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
  }
}

export default function EmailSecurityPage() {
  const { toast } = useToast()

  // Tab
  const [tab, setTab] = useState<'blocklist' | 'appeals'>('blocklist')

  // Blocklist state
  const [blocklistEntries, setBlocklistEntries] = useState<BlocklistEntry[]>([])
  const [blocklistMeta, setBlocklistMeta] = useState({ total: 0, currentPage: 1, lastPage: 1 })
  const [blocklistSearch, setBlocklistSearch] = useState('')
  const [blocklistLoading, setBlocklistLoading] = useState(true)
  const [totalBlocked, setTotalBlocked] = useState(0)

  // Add domain
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [newReason, setNewReason] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  // Appeals state
  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [appealsMeta, setAppealsMeta] = useState({ total: 0, currentPage: 1, lastPage: 1 })
  const [appealsFilter, setAppealsFilter] = useState('')
  const [appealsLoading, setAppealsLoading] = useState(true)

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewAppeal, setReviewAppeal] = useState<Appeal | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  const fetchBlocklist = useCallback(async (page = 1) => {
    setBlocklistLoading(true)
    const { data } = await api.get<{
      entries: PaginatedResponse<BlocklistEntry>
      totalBlocked: number
    }>(`/admin/email-blocklist?page=${page}&search=${encodeURIComponent(blocklistSearch)}`)
    if (data) {
      setBlocklistEntries(data.entries.data)
      setBlocklistMeta({
        total: data.entries.meta.total,
        currentPage: data.entries.meta.currentPage,
        lastPage: data.entries.meta.lastPage,
      })
      setTotalBlocked(data.totalBlocked)
    }
    setBlocklistLoading(false)
  }, [blocklistSearch])

  const fetchAppeals = useCallback(async (page = 1) => {
    setAppealsLoading(true)
    const { data } = await api.get<{
      appeals: PaginatedResponse<Appeal>
    }>(`/admin/email-appeals?page=${page}&status=${appealsFilter}`)
    if (data) {
      setAppeals(data.appeals.data)
      setAppealsMeta({
        total: data.appeals.meta.total,
        currentPage: data.appeals.meta.currentPage,
        lastPage: data.appeals.meta.lastPage,
      })
    }
    setAppealsLoading(false)
  }, [appealsFilter])

  useEffect(() => {
    if (tab === 'blocklist') fetchBlocklist()
    else fetchAppeals()
  }, [tab, fetchBlocklist, fetchAppeals])

  async function handleAddDomain() {
    if (!newDomain.trim()) return
    setAddLoading(true)
    const { error } = await api.post('/admin/email-blocklist', {
      domain: newDomain.trim(),
      reason: newReason.trim() || undefined,
    })
    setAddLoading(false)
    if (error) {
      toast(error, 'error')
      return
    }
    toast(`Domaine ${newDomain} ajouté à la blocklist`, 'success')
    setAddModalOpen(false)
    setNewDomain('')
    setNewReason('')
    fetchBlocklist()
  }

  async function handleDeleteDomain(domain: string) {
    const { error } = await api.delete(`/admin/email-blocklist/${encodeURIComponent(domain)}`)
    if (error) {
      toast(error, 'error')
      return
    }
    toast(`Domaine ${domain} supprimé`, 'success')
    fetchBlocklist()
  }

  function openReview(appeal: Appeal) {
    setReviewAppeal(appeal)
    setReviewNote('')
    setReviewModalOpen(true)
  }

  async function handleReview(status: 'approved' | 'rejected') {
    if (!reviewAppeal) return
    setReviewLoading(true)
    const { error } = await api.patch(`/admin/email-appeals/${reviewAppeal.id}`, {
      status,
      adminNote: reviewNote.trim() || undefined,
    })
    setReviewLoading(false)
    if (error) {
      toast(error, 'error')
      return
    }
    toast(
      status === 'approved'
        ? `Domaine ${reviewAppeal.domain} débloqué`
        : 'Demande rejetée',
      'success'
    )
    setReviewModalOpen(false)
    setReviewAppeal(null)
    fetchAppeals()
  }

  const pendingCount = appeals.filter(a => a.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Sécurité des emails</h1>
            <p className="text-sm text-muted-foreground">
              Gérer la blocklist des emails temporaires et les demandes de déblocage
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">{totalBlocked.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-muted-foreground">domaines bloqués</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 border border-border">
        <button
          onClick={() => setTab('blocklist')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'blocklist'
              ? 'bg-card text-foreground shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          Blocklist
        </button>
        <button
          onClick={() => setTab('appeals')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'appeals'
              ? 'bg-card text-foreground shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="h-4 w-4" />
          Demandes
          {pendingCount > 0 && (
            <Badge variant="warning" className="ml-1">{pendingCount}</Badge>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Blocklist Tab */}
        {tab === 'blocklist' && (
          <motion.div
            key="blocklist"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un domaine..."
                      value={blocklistSearch}
                      onChange={(e) => setBlocklistSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchBlocklist()}
                      className="pl-9 h-9"
                    />
                  </div>
                  <Button onClick={() => setAddModalOpen(true)} className="h-9 gap-2">
                    <Plus className="h-4 w-4" /> Ajouter
                  </Button>
                </div>

                {blocklistLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner />
                  </div>
                ) : blocklistEntries.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun domaine personnalisé dans la blocklist DB.</p>
                    <p className="text-xs mt-1">La liste statique de {totalBlocked.toLocaleString('fr-FR')} domaines est toujours active.</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-border">
                      {blocklistEntries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-mono text-sm text-foreground">{entry.domain}</span>
                            <Badge variant={entry.action === 'block' ? 'destructive' : 'success'}>
                              {entry.action === 'block' ? 'Bloqué' : 'Autorisé'}
                            </Badge>
                            {entry.reason && (
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {entry.reason}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDomain(entry.domain)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {blocklistMeta.lastPage > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Page {blocklistMeta.currentPage} sur {blocklistMeta.lastPage}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchBlocklist(blocklistMeta.currentPage - 1)}
                            disabled={blocklistMeta.currentPage <= 1}
                            className="h-8"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchBlocklist(blocklistMeta.currentPage + 1)}
                            disabled={blocklistMeta.currentPage >= blocklistMeta.lastPage}
                            className="h-8"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Appeals Tab */}
        {tab === 'appeals' && (
          <motion.div
            key="appeals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  {['', 'pending', 'approved', 'rejected'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setAppealsFilter(f)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        appealsFilter === f
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      {f === '' ? 'Toutes' : f === 'pending' ? 'En attente' : f === 'approved' ? 'Approuvées' : 'Rejetées'}
                    </button>
                  ))}
                </div>

                {appealsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner />
                  </div>
                ) : appeals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune demande de déblocage.</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-border">
                      {appeals.map((appeal) => (
                        <div key={appeal.id} className="py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-foreground">{appeal.email}</span>
                                <Badge
                                  variant={
                                    appeal.status === 'pending' ? 'warning'
                                      : appeal.status === 'approved' ? 'success'
                                        : 'destructive'
                                  }
                                >
                                  {appeal.status === 'pending' ? 'En attente'
                                    : appeal.status === 'approved' ? 'Approuvée'
                                      : 'Rejetée'}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">
                                Domaine : <span className="font-mono">{appeal.domain}</span>
                                {appeal.ipAddress && <> &middot; IP : {appeal.ipAddress}</>}
                                {' '}&middot; {new Date(appeal.createdAt).toLocaleDateString('fr-FR')}
                              </p>
                              <p className="text-sm text-muted-foreground">{appeal.reason}</p>
                              {appeal.adminNote && (
                                <p className="text-xs text-primary mt-1">Note admin : {appeal.adminNote}</p>
                              )}
                            </div>
                            {appeal.status === 'pending' && (
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openReview(appeal)}
                                  className="h-8 gap-1.5 text-green-500 border-green-500/30 hover:bg-green-500/10"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Approuver
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openReview(appeal)}
                                  className="h-8 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Rejeter
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {appealsMeta.lastPage > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Page {appealsMeta.currentPage} sur {appealsMeta.lastPage}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchAppeals(appealsMeta.currentPage - 1)}
                            disabled={appealsMeta.currentPage <= 1}
                            className="h-8"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchAppeals(appealsMeta.currentPage + 1)}
                            disabled={appealsMeta.currentPage >= appealsMeta.lastPage}
                            className="h-8"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add domain modal */}
      <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)}>
        <DialogTitle>Ajouter un domaine</DialogTitle>
        <DialogDescription>
          Ce domaine sera bloqué pour toutes les nouvelles inscriptions.
        </DialogDescription>
        <div className="mt-4 space-y-3">
          <Input
            placeholder="exemple.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            className="h-10 font-mono"
          />
          <Textarea
            placeholder="Raison (optionnel)"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            className="min-h-[60px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAddModalOpen(false)} className="h-9">
            Annuler
          </Button>
          <Button onClick={handleAddDomain} disabled={addLoading || !newDomain.trim()} className="h-9 gap-2">
            {addLoading ? <><Spinner size="sm" /> Ajout...</> : <><Plus className="h-3.5 w-3.5" /> Ajouter</>}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Review appeal modal */}
      <Dialog open={reviewModalOpen} onClose={() => setReviewModalOpen(false)}>
        {reviewAppeal && (
          <>
            <DialogTitle>Examiner la demande</DialogTitle>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1">
                <p className="text-sm"><span className="text-muted-foreground">Email :</span> <span className="font-medium">{reviewAppeal.email}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Domaine :</span> <span className="font-mono">{reviewAppeal.domain}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">Raison :</span> {reviewAppeal.reason}</p>
              </div>
              <Textarea
                placeholder="Note admin (optionnel)"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewModalOpen(false)} className="h-9">
                Annuler
              </Button>
              <Button
                variant="outline"
                onClick={() => handleReview('rejected')}
                disabled={reviewLoading}
                className="h-9 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                {reviewLoading ? <Spinner size="sm" /> : <XCircle className="h-3.5 w-3.5" />}
                Rejeter
              </Button>
              <Button
                onClick={() => handleReview('approved')}
                disabled={reviewLoading}
                className="h-9 gap-1.5"
              >
                {reviewLoading ? <Spinner size="sm" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Approuver
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  )
}
