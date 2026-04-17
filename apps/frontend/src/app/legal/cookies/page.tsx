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
          <p className="text-sm text-muted-foreground">Derniere mise a jour : 19 mars 2026</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Un cookie est un petit fichier texte stocke sur votre appareil lorsque vous visitez un site web.
              Les cookies permettent au site de memoriser vos actions et preferences.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">2. Cookies utilises par Faktur</h2>
            <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>
                Faktur utilise un nombre minimal de cookies, strictement necessaires au fonctionnement du service.
                <strong className="text-foreground"> Nous n&apos;utilisons aucun cookie publicitaire ou de tracking.</strong>
              </p>

              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2.5 font-medium text-foreground/80">Cookie</th>
                      <th className="text-left p-2.5 font-medium text-foreground/80">Type</th>
                      <th className="text-left p-2.5 font-medium text-foreground/80">Duree</th>
                      <th className="text-left p-2.5 font-medium text-foreground/80">Finalite</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="p-2.5 font-mono">faktur_auth</td>
                      <td className="p-2.5">Essentiel</td>
                      <td className="p-2.5">15 jours max</td>
                      <td className="p-2.5">Cookie de session HttpOnly pour l&apos;authentification</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono">faktur_vault</td>
                      <td className="p-2.5">Essentiel</td>
                      <td className="p-2.5">15 jours max</td>
                      <td className="p-2.5">Cookie HttpOnly servant au deverrouillage du coffre-fort chiffre</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono">faktur_theme</td>
                      <td className="p-2.5">Preference</td>
                      <td className="p-2.5">Persistant</td>
                      <td className="p-2.5">Theme clair ou sombre choisi</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-xs italic">
                Les cookies de session sensibles sont stockes en HttpOnly pour ne pas etre lisibles depuis JavaScript.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">3. Cookies tiers</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Faktur n&apos;integre aucun service tiers deposant des cookies. Nous ne partageons aucune donnee de navigation avec des tiers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">4. Gestion des cookies</h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>
                Les cookies utilises par Faktur etant strictement necessaires au fonctionnement du service,
                ils ne necessitent pas de consentement prealable.
              </p>
              <p>
                Vous pouvez neanmoins supprimer les donnees du site a tout moment via les parametres
                de votre navigateur. Cela vous deconnectera du service.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">5. Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pour toute question relative aux cookies, contactez-nous a l&apos;adresse : contact@danbenba.dev
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
