'use client'

import { useAuth } from '@/lib/auth'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, FileText, Receipt, Users, Plus, ArrowRight } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
}

const stats = [
  { label: "Chiffre d'affaires", value: '0 EUR', icon: TrendingUp, color: 'text-success' },
  { label: 'Factures', value: '0', icon: FileText, color: 'text-primary' },
  { label: 'Devis', value: '0', icon: Receipt, color: 'text-yellow-500' },
  { label: 'Clients', value: '0', icon: Users, color: 'text-blue-400' },
]

const quickActions = [
  { label: 'Nouvelle facture', icon: FileText, href: '/invoices' },
  { label: 'Nouveau devis', icon: Receipt, href: '/quotes' },
  { label: 'Nouveau client', icon: Users, href: '/clients' },
]

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-8">
      {/* Welcome */}
      <motion.div variants={fadeUp} custom={0}>
        <h1 className="text-3xl font-bold text-foreground">
          Bonjour{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''} !
        </h1>
        <p className="mt-1 text-muted-foreground">
          Voici un apercu de votre activite.
        </p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} variants={fadeUp} custom={i + 1}>
            <Card className="hover:border-border/80 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <motion.div variants={fadeUp} custom={5}>
        <h2 className="text-lg font-semibold text-foreground mb-4">Actions rapides</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Card
              key={action.label}
              className="group cursor-pointer hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5"
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{action.label}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Recent activity */}
      <motion.div variants={fadeUp} custom={6}>
        <h2 className="text-lg font-semibold text-foreground mb-4">Activite recente</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Aucune activite recente.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Creez votre premiere facture ou devis pour commencer.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
