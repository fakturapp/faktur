import Invoice from '#models/invoice/invoice'
import Quote from '#models/quote/quote'
import CreditNote from '#models/credit_note/credit_note'
import DocumentShare from '#models/collaboration/document_share'
import DocumentShareLink from '#models/collaboration/document_share_link'
import type { DocumentType, SharePermission } from '#models/collaboration/document_share'

export default class DocumentAccessService {
  async getDocument(documentType: DocumentType, documentId: string, teamId: string) {
    switch (documentType) {
      case 'invoice':
        return Invoice.query().where('id', documentId).where('team_id', teamId).first()
      case 'quote':
        return Quote.query().where('id', documentId).where('team_id', teamId).first()
      case 'credit_note':
        return CreditNote.query().where('id', documentId).where('team_id', teamId).first()
      default:
        return null
    }
  }

  async isDocumentOwner(documentType: DocumentType, documentId: string, teamId: string, _userId: string): Promise<boolean> {
    const document = await this.getDocument(documentType, documentId, teamId)
    if (!document) return false
    return true
  }

  async getUserPermission(
    documentType: DocumentType,
    documentId: string,
    teamId: string,
    _userId: string
  ): Promise<{ permission: SharePermission; isOwner: boolean } | null> {
    const document = await this.getDocument(documentType, documentId, teamId)
    if (!document) return null

    return { permission: 'editor', isOwner: true }
  }

  async getSharePermission(
    documentType: DocumentType,
    documentId: string,
    userId: string
  ): Promise<SharePermission | null> {
    const share = await DocumentShare.query()
      .where('document_type', documentType)
      .where('document_id', documentId)
      .where('shared_with_user_id', userId)
      .where('status', 'active')
      .first()

    return share?.permission ?? null
  }

  async validateShareLink(token: string): Promise<DocumentShareLink | null> {
    const link = await DocumentShareLink.query()
      .where('token', token)
      .where('is_active', true)
      .first()

    if (!link) return null
    if (link.isExpired) return null

    return link
  }
}
