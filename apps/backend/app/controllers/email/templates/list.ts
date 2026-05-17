import type { HttpContext } from '@adonisjs/core/http'
import EmailTemplate from '#models/email/email_template'

function buildTemplate(opts: {
  headerColor: string
  badge: string
  intro: string
  closing: string
  amountLabel: string
}): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:32px 0">
  <tr>
    <td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px">
        <tr>
          <td style="background:${opts.headerColor};padding:32px 32px 24px;color:#ffffff">
            <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;opacity:0.92">${opts.badge}</p>
            <h1 style="margin:6px 0 0;font-size:26px;font-weight:700;line-height:1.2">{numero}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 16px;font-size:16px;color:#0f172a">Bonjour{client_name},</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569">${opts.intro}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:0 0 24px">
              <tr>
                <td style="padding:20px 24px">
                  <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;color:#64748b">${opts.amountLabel}</p>
                  <p style="margin:6px 0 0;font-size:28px;font-weight:700;color:#0f172a;line-height:1.1">{montant}</p>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569">${opts.closing}</p>
            <p style="margin:0;font-size:15px;color:#0f172a">Cordialement</p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
            <p style="margin:0;font-size:12px;color:#94a3b8">Document joint au format PDF.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
}

const DEFAULTS: Record<string, { subject: string; body: string }> = {
  invoice_send: {
    subject: '{type} {numero}',
    body: buildTemplate({
      headerColor: '#3b82f6',
      badge: 'Nouvelle {type}',
      intro:
        'Vous trouverez ci-joint votre {type} <strong style="color:#0f172a">{numero}</strong>. Le règlement peut être effectué selon les modalités indiquées sur le document.',
      closing: "N'hésitez pas à nous contacter pour toute question concernant cette {type}.",
      amountLabel: 'Montant TTC',
    }),
  },
  quote_send: {
    subject: '{type} {numero}',
    body: buildTemplate({
      headerColor: '#f97316',
      badge: 'Votre {type}',
      intro:
        'Veuillez trouver ci-joint le {type} <strong style="color:#0f172a">{numero}</strong> correspondant à votre demande. Ce devis est valable selon les modalités indiquées sur le document.',
      closing:
        'Pour valider ce {type} ou nous transmettre vos remarques, il vous suffit de répondre à cet email.',
      amountLabel: 'Montant TTC estimé',
    }),
  },
  credit_note_send: {
    subject: '{type} {numero}',
    body: buildTemplate({
      headerColor: '#8b5cf6',
      badge: 'Votre {type}',
      intro:
        'Vous trouverez ci-joint l\'{type} <strong style="color:#0f172a">{numero}</strong> émis suite à votre demande.',
      closing:
        'Cet avoir sera déduit de votre prochaine facture ou remboursé selon les modalités convenues.',
      amountLabel: "Montant de l'avoir",
    }),
  },
}

export default class List {
  async handle({ auth, response }: HttpContext) {
    const user = auth.user!
    const teamId = user.currentTeamId

    if (!teamId) {
      return response.badRequest({ message: 'No team selected' })
    }

    const templates = await EmailTemplate.query().where('team_id', teamId)

    const result: Record<string, { subject: string; body: string }> = {}
    for (const type of Object.keys(DEFAULTS)) {
      const existing = templates.find((t) => t.templateType === type)
      result[type] = existing ? { subject: existing.subject, body: existing.body } : DEFAULTS[type]
    }

    return response.ok({ templates: result })
  }
}
