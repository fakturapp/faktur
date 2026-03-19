'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Cookie } from 'lucide-react'

export default function CookiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Cookie className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Politique de cookies</h1>
          <p className="text-sm text-muted-foreground">Dernière mise à jour : 19 mars 2026</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Un cookie est un petit fichier texte stocké sur votre appareil lorsque vous visitez un site web.
              Les cookies permettent au site de mémoriser vos actions et préférences.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">2. Cookies utilisés par Faktur</h2>
            <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>
                Faktur utilise un nombre minimal de cookies, strictement nécessaires au fonctionnement du service.
                <strong className="text-foreground"> Nous n&apos;utilisons aucun cookie publicitaire ou de tracking.</strong>
              </p>

              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2.5 font-medium text-foreground/80">Cookie</th>
                      <th className="text-left p-2.5 font-medium text-foreground/80">Type</th>
                      <th className="text-left p-2.5 font-medium text-foreground/80">Durée</th>
                      <th className="text-left p-2.5 font-medium text-foreground/80">Finalité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="p-2.5 font-mono">faktur_token</td>
                      <td className="p-2.5">Essentiel</td>
                      <td className="p-2.5">Session</td>
                      <td className="p-2.5">Token d&apos;authentification (localStorage)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono">theme</td>
                      <td className="p-2.5">Préférence</td>
                      <td className="p-2.5">Persistant</td>
                      <td className="p-2.5">Thème clair / sombre choisi</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-xs italic">
                Note : le token d&apos;authentification est stocké dans le localStorage du navigateur
                (techniquement pas un cookie), mais nous le mentionnons par transparence.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">3. Cookies tiers</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Faktur n&apos;intègre aucun service tiers déposant des cookies (pas de Google Analytics,
              pas de Facebook Pixel, pas de publicité). Nous ne partageons aucune donnée de navigation
              avec des tiers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">4. Gestion des cookies</h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>
                Les cookies utilisés par Faktur étant strictement nécessaires au fonctionnement du service,
                ils ne nécessitent pas de consentement préalable (exemption CNIL pour les cookies techniques).
              </p>
              <p>
                Vous pouvez néanmoins supprimer les données du site à tout moment via les paramètres
                de votre navigateur. Cela vous déconnectera du service.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">5. Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pour toute question relative aux cookies, contactez-nous
              à l&apos;adresse : contact@danbenba.dev
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
