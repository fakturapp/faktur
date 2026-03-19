'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Lock } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Politique de confidentialité</h1>
          <p className="text-sm text-muted-foreground">Dernière mise à jour : 19 mars 2026</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">1. Introduction</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La présente politique de confidentialité décrit comment Faktur collecte, utilise et protège
              vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD)
              et à la loi Informatique et Libertés.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">2. Responsable du traitement</h2>
            <div className="text-sm text-muted-foreground space-y-1 leading-relaxed">
              <p>Le responsable du traitement des données est :</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Nom : danbenba</li>
                <li>Contact : contact@danbenba.dev</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">3. Données collectées</h2>
            <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <div>
                <p className="font-medium text-foreground/80 mb-1">Données de compte :</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Adresse email (pour l&apos;authentification et les communications)</li>
                  <li>Nom complet (facultatif)</li>
                  <li>Mot de passe (hashé avec Scrypt, jamais stocké en clair)</li>
                  <li>Avatar (facultatif)</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-foreground/80 mb-1">Données métier (chiffrées) :</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Informations clients (noms, emails, adresses, SIREN)</li>
                  <li>Contenu des factures et devis (sujets, notes, conditions)</li>
                  <li>Coordonnées bancaires (IBAN, BIC)</li>
                  <li>Informations entreprise (téléphone, email)</li>
                </ul>
                <p className="mt-1 text-xs italic">
                  Ces données sont chiffrées avec votre mot de passe (AES-256-GCM).
                  Nous ne pouvons pas les lire.
                </p>
              </div>

              <div>
                <p className="font-medium text-foreground/80 mb-1">Données techniques :</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Adresse IP (journaux de connexion)</li>
                  <li>User-Agent du navigateur</li>
                  <li>Dates de connexion</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">4. Finalités du traitement</h2>
            <div className="text-sm text-muted-foreground leading-relaxed">
              <p>Vos données sont traitées pour les finalités suivantes :</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2 mt-1">
                <li>Fournir et améliorer le service de facturation</li>
                <li>Authentifier votre identité et sécuriser votre compte</li>
                <li>Générer les documents PDF (factures, devis)</li>
                <li>Envoyer les emails transactionnels (vérification, réinitialisation)</li>
                <li>Détecter et prévenir les abus</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">5. Base légale</h2>
            <div className="text-sm text-muted-foreground leading-relaxed">
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li><strong className="text-foreground/80">Exécution du contrat</strong> : traitement nécessaire à la fourniture du service</li>
                <li><strong className="text-foreground/80">Intérêt légitime</strong> : sécurité du service, prévention des abus</li>
                <li><strong className="text-foreground/80">Obligation légale</strong> : conservation des données de connexion</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">6. Chiffrement zero-access</h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>
                Faktur utilise une architecture de chiffrement zero-access inspirée de Proton.
                Vos données sensibles sont chiffrées avec une clé dérivée de votre mot de passe
                via Argon2id, puis chiffrées individuellement avec AES-256-GCM.
              </p>
              <p>
                <strong className="text-foreground/80">Concrètement :</strong> même avec un accès complet
                à nos serveurs (base de données, code source, variables d&apos;environnement), il est
                impossible de lire vos données chiffrées sans connaître votre mot de passe.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">7. Partage des données</h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>Vos données ne sont jamais vendues. Elles peuvent être partagées avec :</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li><strong className="text-foreground/80">OVHcloud</strong> (hébergement) — serveurs en France, UE</li>
                <li><strong className="text-foreground/80">Resend</strong> (emails transactionnels) — pour l&apos;envoi des emails de vérification</li>
                <li><strong className="text-foreground/80">Google</strong> (Gmail OAuth) — uniquement si vous connectez votre compte Gmail pour l&apos;envoi de factures</li>
              </ul>
              <p>
                Toutes les données sont hébergées en France.
                Aucun transfert en dehors de l&apos;UE n&apos;est effectué sans les garanties appropriées.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">8. Durée de conservation</h2>
            <div className="text-sm text-muted-foreground leading-relaxed">
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li><strong className="text-foreground/80">Données de compte</strong> : conservées jusqu&apos;à suppression du compte</li>
                <li><strong className="text-foreground/80">Données métier</strong> : conservées jusqu&apos;à suppression par l&apos;utilisateur ou du compte</li>
                <li><strong className="text-foreground/80">Journaux de connexion</strong> : conservés 12 mois</li>
                <li><strong className="text-foreground/80">Journaux d&apos;audit</strong> : conservés 24 mois</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">9. Vos droits</h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li><strong className="text-foreground/80">Droit d&apos;accès</strong> : obtenir une copie de vos données</li>
                <li><strong className="text-foreground/80">Droit de rectification</strong> : corriger vos données inexactes</li>
                <li><strong className="text-foreground/80">Droit à l&apos;effacement</strong> : supprimer votre compte et vos données</li>
                <li><strong className="text-foreground/80">Droit à la portabilité</strong> : exporter vos données (PDF, CSV, JSON)</li>
                <li><strong className="text-foreground/80">Droit d&apos;opposition</strong> : vous opposer au traitement de vos données</li>
                <li><strong className="text-foreground/80">Droit à la limitation</strong> : restreindre le traitement</li>
              </ul>
              <p>
                Pour exercer vos droits, contactez-nous à contact@danbenba.dev.
                Vous pouvez également introduire une réclamation auprès de la CNIL (cnil.fr).
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">10. Sécurité</h2>
            <div className="text-sm text-muted-foreground leading-relaxed">
              <p>Nous mettons en œuvre les mesures de sécurité suivantes :</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2 mt-1">
                <li>Chiffrement zero-access (AES-256-GCM + Argon2id)</li>
                <li>Communications HTTPS/TLS obligatoires</li>
                <li>Authentification à deux facteurs (2FA) disponible</li>
                <li>Rate limiting et protection contre les attaques</li>
                <li>Serveurs hébergés en France (OVHcloud)</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">11. Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pour toute question relative à la protection de vos données, contactez-nous
              à l&apos;adresse : contact@danbenba.dev
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
