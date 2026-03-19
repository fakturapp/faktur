'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Shield, Lock, Key, Eye, Server } from 'lucide-react'

export default function SecurityPolicyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Politique de sécurité</h1>
          <p className="text-sm text-muted-foreground">Dernière mise à jour : 19 mars 2026</p>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { icon: Lock, title: 'Chiffrement AES-256-GCM', desc: 'Toutes les données sensibles sont chiffrées individuellement' },
          { icon: Key, title: 'Zero-access', desc: 'Le serveur ne peut jamais lire vos données' },
          { icon: Eye, title: '2FA disponible', desc: 'Authentification à deux facteurs (TOTP)' },
          { icon: Server, title: 'Hébergement UE', desc: 'Serveurs en Allemagne (Hetzner)' },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">1. Architecture de chiffrement</h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>
                Faktur utilise une architecture de chiffrement <strong className="text-foreground">zero-access</strong> inspirée
                de Proton Mail. Le principe : vos données sont chiffrées avec une clé dérivée de votre
                mot de passe. Le serveur ne stocke jamais aucune clé de déchiffrement.
              </p>

              <div className="rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs space-y-1">
                <p className="text-foreground/70">Mot de passe</p>
                <p className="text-muted-foreground pl-2">↓ Argon2id (64 Mo, 3 itérations)</p>
                <p className="text-foreground/70 mt-1">KEK (Key Encryption Key) — jamais stockée</p>
                <p className="text-muted-foreground pl-2">↓ AES-256-GCM</p>
                <p className="text-foreground/70 mt-1">DEK (Data Encryption Key) — unique par équipe, stockée chiffrée</p>
                <p className="text-muted-foreground pl-2">↓ AES-256-GCM (IV unique par opération)</p>
                <p className="text-foreground/70 mt-1">Données chiffrées (noms, emails, IBAN, notes...)</p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">2. Données chiffrées</h2>
            <div className="text-sm text-muted-foreground leading-relaxed">
              <p>Les champs suivants sont chiffrés individuellement avec AES-256-GCM :</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2 mt-1">
                <li>Noms et contacts des clients</li>
                <li>Adresses email</li>
                <li>Adresses postales</li>
                <li>Numéros SIREN, SIRET, TVA intracommunautaire</li>
                <li>Coordonnées bancaires (IBAN, BIC)</li>
                <li>Sujets et notes des factures et devis</li>
                <li>Conditions d&apos;acceptation et commentaires</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">3. Ce que le serveur ne stocke jamais</h2>
            <div className="text-sm text-muted-foreground leading-relaxed">
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Votre mot de passe en clair (hashé avec Scrypt)</li>
                <li>La KEK (dérivée à chaque session, jamais persistée)</li>
                <li>La DEK en clair (stockée uniquement sous forme chiffrée)</li>
                <li>Vos données sensibles en clair</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">4. Scénario de compromission</h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>
                Même avec un accès complet au serveur (base de données, code source, variables
                d&apos;environnement), un attaquant n&apos;obtient que des données chiffrées illisibles.
              </p>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2.5 font-medium text-foreground/80">Élément</th>
                      <th className="text-left p-2.5 font-medium text-foreground/80">État</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr><td className="p-2.5">Champs sensibles</td><td className="p-2.5">Chiffrés (illisibles)</td></tr>
                    <tr><td className="p-2.5">DEK</td><td className="p-2.5">Chiffrée avec la KEK</td></tr>
                    <tr><td className="p-2.5">Salt Argon2id</td><td className="p-2.5">Inutile sans le mot de passe</td></tr>
                    <tr><td className="p-2.5">APP_KEY</td><td className="p-2.5">N&apos;intervient pas dans le zero-access</td></tr>
                    <tr><td className="p-2.5">Code source</td><td className="p-2.5">Aucun secret cryptographique</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs italic">
                Coût estimé du brute-force Argon2id pour un mot de passe de 12 caractères :
                ~50 milliards d&apos;années sur 1000 machines.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">5. Authentification</h2>
            <div className="text-sm text-muted-foreground leading-relaxed">
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Mots de passe hashés avec Scrypt</li>
                <li>Authentification à deux facteurs (2FA) via TOTP</li>
                <li>Codes de récupération 2FA (à conserver en lieu sûr)</li>
                <li>Vérification email obligatoire</li>
                <li>Tokens Bearer avec expiration automatique</li>
                <li>Historique de connexion consultable</li>
                <li>Rate limiting sur les endpoints sensibles</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">6. Infrastructure</h2>
            <div className="text-sm text-muted-foreground leading-relaxed">
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Serveurs hébergés chez Hetzner (Allemagne, UE)</li>
                <li>Communications HTTPS/TLS obligatoires</li>
                <li>Headers de sécurité (Helmet, CORS, Shield)</li>
                <li>Protection CSRF intégrée</li>
                <li>Base de données PostgreSQL avec UUID</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">7. Signaler une vulnérabilité</h2>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <p>
                Si vous découvrez une vulnérabilité, <strong className="text-foreground">ne créez pas d&apos;issue publique</strong>.
                Envoyez un email à :
              </p>
              <p className="font-medium text-foreground">contact@fakturapp.cc</p>
              <p>
                Nous nous engageons à accuser réception sous 48 heures et à fournir
                une évaluation initiale sous 7 jours.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">8. Bonnes pratiques</h2>
            <div className="text-sm text-muted-foreground leading-relaxed">
              <p>Pour maximiser la sécurité de votre compte :</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2 mt-1">
                <li>Utilisez un mot de passe fort (12 caractères minimum)</li>
                <li>Activez l&apos;authentification à deux facteurs</li>
                <li>Conservez vos codes de récupération 2FA en lieu sûr</li>
                <li>Ne partagez jamais votre mot de passe</li>
                <li>Vérifiez régulièrement votre historique de connexion</li>
              </ul>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
