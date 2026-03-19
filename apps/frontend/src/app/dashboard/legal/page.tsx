'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Scale } from 'lucide-react'

export default function MentionsLegalesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Scale className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Mentions légales</h1>
          <p className="text-sm text-muted-foreground">Dernière mise à jour : 19 mars 2026</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">1. Éditeur du site</h2>
            <div className="text-sm text-muted-foreground space-y-1 leading-relaxed">
              <p>Le site <strong className="text-foreground">Faktur</strong> (fakturapp.cc, dash.fakturapp.cc, api.fakturapp.cc) est édité par :</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Nom : danbenba</li>
                <li>Statut : Personne physique</li>
                <li>Contact : contact@fakturapp.cc</li>
                <li>Site web : fakturapp.cc</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">2. Directeur de la publication</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Le directeur de la publication est danbenba, joignable à contact@fakturapp.cc.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">3. Hébergement</h2>
            <div className="text-sm text-muted-foreground space-y-1 leading-relaxed">
              <p>Le site et l&apos;application sont hébergés par :</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Hébergeur : Hetzner Online GmbH</li>
                <li>Adresse : Industriestr. 25, 91710 Gunzenhausen, Allemagne</li>
                <li>Site web : hetzner.com</li>
              </ul>
              <p className="mt-2">
                Les serveurs sont situés dans l&apos;Union européenne (Allemagne), conformément au RGPD.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">4. Propriété intellectuelle</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              L&apos;ensemble du contenu du site (textes, images, logos, code source, design) est la propriété
              exclusive de danbenba et est protégé par le droit d&apos;auteur. Le code source est disponible
              sous <strong className="text-foreground">Personal Use License</strong> — usage personnel uniquement.
              Toute reproduction, redistribution ou utilisation commerciale est interdite sans autorisation écrite.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">5. Responsabilité</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              L&apos;éditeur s&apos;efforce d&apos;assurer l&apos;exactitude des informations diffusées sur le site,
              mais ne saurait être tenu responsable des erreurs, omissions ou résultats obtenus suite à
              l&apos;utilisation de ces informations. L&apos;accès au site peut être interrompu à tout moment
              pour des raisons de maintenance ou de force majeure.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">6. Liens hypertextes</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Le site peut contenir des liens vers des sites tiers. L&apos;éditeur n&apos;exerce aucun contrôle
              sur ces sites et décline toute responsabilité quant à leur contenu.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">7. Droit applicable</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Les présentes mentions légales sont régies par le droit français. Tout litige sera soumis
              aux tribunaux compétents.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
