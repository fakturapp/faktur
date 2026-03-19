'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Scale, ScrollText, Lock, Shield, Cookie, ChevronRight } from 'lucide-react'

const legalPages = [
  {
    href: '/dashboard/legal/mentions',
    icon: Scale,
    title: 'Mentions légales',
    description: 'Éditeur, hébergeur et informations légales obligatoires',
  },
  {
    href: '/dashboard/legal/terms',
    icon: ScrollText,
    title: "Conditions générales d'utilisation",
    description: "Règles d'utilisation du service Faktur",
  },
  {
    href: '/dashboard/legal/privacy',
    icon: Lock,
    title: 'Politique de confidentialité',
    description: 'Comment nous collectons et protégeons vos données (RGPD)',
  },
  {
    href: '/dashboard/legal/security',
    icon: Shield,
    title: 'Politique de sécurité',
    description: 'Architecture de chiffrement zero-access et mesures de protection',
  },
  {
    href: '/dashboard/legal/cookies',
    icon: Cookie,
    title: 'Politique de cookies',
    description: 'Cookies utilisés et gestion de vos préférences',
  },
]

export default function LegalHubPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Scale className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Informations légales</h1>
          <p className="text-sm text-muted-foreground">Transparence et respect de vos droits</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Chez Faktur, nous nous engageons à respecter votre vie privée et à protéger vos données.
            Notre service utilise un chiffrement zero-access : même nous ne pouvons pas lire vos données sensibles.
            Retrouvez ci-dessous l&apos;ensemble de nos documents légaux.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {legalPages.map((page) => (
          <Link key={page.href} href={page.href}>
            <Card className="transition-colors hover:bg-muted/50 cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <page.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{page.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{page.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
