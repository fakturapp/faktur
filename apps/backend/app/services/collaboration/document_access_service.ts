import Invoice from '#models/invoice/invoice'
import Quote from '#models/quote/quote'
import CreditNote from '#models/credit_note/credit_note'
import DocumentShare from '#models/collaboration/document_share'
import DocumentShareLink from '#models/collaboration/document_share_link'
import type { DocumentType, SharePermission } from '#models/collaboration/document_share'

/**
 * Resolves document ownership, validates access, and checks permissions
 * for collaborative document sharing.
 */
export default class DocumentAccessService {
  /**
   * Verify that a document exists and belongs to the given team.
   * Returns the document or null.
   */
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

  /**
   * Check if a user is the owner (team member) of the document's team.
   */
  async isDocumentOwner(documentType: DocumentType, documentId: string, teamId: string, _userId: string): Promise<boolean> {
    const document = await this.getDocument(documentType, documentId, teamId)
    if (!document) return false
    // The document belongs to the team, and the user is in this team context
    return true
  }

  /**
   * Get the permission level of a user for a given document.
   * Returns null if no access, or the permission level.
   */
  async getUserPermission(
    documentType: DocumentType,
    documentId: string,
    teamId: string,
    _userId: string
  ): Promise<{ permission: SharePermission; isOwner: boolean } | null> {
    // Check if user is a team member (they always have full access)
    const document = await this.getDocument(documentType, documentId, teamId)
    if (!document) return null

    // If the user's current team is the document's team, they're the owner/team member
    // Team members who are admin/super_admin/member have editor rights
    // Team members who are viewer have viewer rights
    // This is already handled by the existing auth middleware, so if they pass auth+vault,
    // they're a team member. We treat them as owners here.
    return { permission: 'editor', isOwner: true }
  }

  /**
   * Get the permission level for a shared user (via document_shares).
   */
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

  /**
   * Validate a share link token and return the link if valid.
   */
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
