'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ScrollText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <ScrollText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Conditions générales d&apos;utilisation</h1>
          <p className="text-sm text-muted-foreground">Dernière mise à jour : 19 mars 2026</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">1. Objet</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Les présentes conditions générales d&apos;utilisation (CGU) ont pour objet de définir les
              modalités d&apos;accès et d&apos;utilisation du service Faktur, accessible à l&apos;adresse
              Faktur. En créant un compte, l&apos;utilisateur accepte sans réserve les présentes CGU.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">2. Description du service</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Faktur est un logiciel de facturation gratuit permettant de créer des devis et factures,
              de gérer des clients et des équipes, et de générer des documents PDF conformes.
              Le service intègre un chiffrement zero-access pour protéger les données sensibles.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">3. Inscription et compte</h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>
                L&apos;accès au service nécessite la création d&apos;un compte. L&apos;utilisateur s&apos;engage à :
              </p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Fournir des informations exactes et à jour</li>
                <li>Assurer la confidentialité de son mot de passe</li>
                <li>Utiliser une adresse email valide et vérifiable</li>
                <li>Ne pas créer de compte à des fins frauduleuses</li>
              </ul>
              <p>
                L&apos;utilisateur est seul responsable de l&apos;activité sur son compte.
                En cas de compromission, il doit en informer immédiatement l&apos;éditeur.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">4. Gratuité du service</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Faktur est un service gratuit. L&apos;éditeur se réserve le droit d&apos;introduire des
              fonctionnalités payantes à l&apos;avenir, sans impacter les fonctionnalités gratuites existantes.
              L&apos;utilisateur sera informé de tout changement tarifaire au moins 30 jours avant son entrée en vigueur.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">5. Utilisation du service</h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>L&apos;utilisateur s&apos;engage à utiliser le service de manière licite et s&apos;interdit de :</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Utiliser le service à des fins illégales ou frauduleuses</li>
                <li>Tenter d&apos;accéder aux données d&apos;autres utilisateurs</li>
                <li>Surcharger intentionnellement les serveurs</li>
                <li>Contourner les mesures de sécurité du service</li>
                <li>Revendre ou redistribuer le service</li>
                <li>Utiliser des robots ou scripts automatisés sans autorisation</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">6. Données et chiffrement</h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>
                Faktur utilise un chiffrement zero-access. Vos données sensibles (noms, emails, adresses,
                coordonnées bancaires) sont chiffrées avec une clé dérivée de votre mot de passe.
              </p>
              <p>
                <strong className="text-foreground">Important :</strong> L&apos;éditeur ne peut pas récupérer
                vos données si vous perdez votre mot de passe et que vous n&apos;avez pas de codes de récupération.
                Vous êtes seul responsable de la conservation de vos identifiants.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">7. Propriété des données</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              L&apos;utilisateur reste propriétaire de toutes les données qu&apos;il saisit dans le service.
              Il peut à tout moment exporter ses données (PDF, CSV, JSON) ou supprimer son compte.
              L&apos;éditeur ne revendique aucun droit sur les données de l&apos;utilisateur.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">8. Disponibilité</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              L&apos;éditeur s&apos;efforce de maintenir le service accessible 24h/24 et 7j/7, mais ne
              garantit pas une disponibilité ininterrompue. Le service peut être suspendu pour maintenance,
              mise à jour ou cas de force majeure. L&apos;éditeur ne saurait être tenu responsable des
              dommages résultant d&apos;une interruption de service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">9. Limitation de responsabilité</h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>
                Le service est fourni « en l&apos;état ». L&apos;éditeur ne garantit pas que le service
                sera exempt d&apos;erreurs ou de défauts. En aucun cas l&apos;éditeur ne pourra être tenu
                responsable :
              </p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>De la perte de données due à une mauvaise utilisation</li>
                <li>Des conséquences fiscales ou juridiques liées aux documents générés</li>
                <li>Des dommages indirects résultant de l&apos;utilisation du service</li>
              </ul>
              <p>
                L&apos;utilisateur reste seul responsable de la conformité de ses documents
                avec la législation en vigueur.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">10. Résiliation</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              L&apos;utilisateur peut supprimer son compte à tout moment depuis les paramètres de son compte.
              L&apos;éditeur se réserve le droit de suspendre ou supprimer un compte en cas de violation
              des présentes CGU, après notification à l&apos;utilisateur.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">11. Modification des CGU</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              L&apos;éditeur se réserve le droit de modifier les présentes CGU. Les utilisateurs seront
              informés de toute modification par notification dans l&apos;application. La poursuite de
              l&apos;utilisation du service après modification vaut acceptation des nouvelles CGU.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">12. Droit applicable</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Les présentes CGU sont régies par le droit français. En cas de litige, les parties
              s&apos;efforceront de trouver une solution amiable. À défaut, les tribunaux français
              seront compétents.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">13. Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pour toute question relative aux présentes CGU, vous pouvez contacter l&apos;éditeur
              à l&apos;adresse : contact@danbenba.dev
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
