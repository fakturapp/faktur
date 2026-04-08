import path from 'node:path'

export default class UploadValidator {
  private static readonly DANGEROUS_PATTERNS = [
    /\.\./,
    /[<>:"|?*]/, // Windows reserved chars
    /[\x00-\x1f]/,
    /^\.+$/,
    /\s{2,}/,
  ]

  private static readonly BLOCKED_EXTENSIONS = new Set([
    '.exe',
    '.bat',
    '.cmd',
    '.com',
    '.msi',
    '.scr',
    '.pif',
    '.vbs',
    '.vbe',
    '.js',
    '.jse',
    '.ws',
    '.wsf',
    '.wsc',
    '.wsh',
    '.ps1',
    '.ps1xml',
    '.ps2',
    '.ps2xml',
    '.psc1',
    '.psc2',
    '.msh',
    '.msh1',
    '.msh2',
    '.mshxml',
    '.msh1xml',
    '.msh2xml',
    '.cpl',
    '.inf',
    '.reg',
    '.rgs',
    '.sct',
    '.shb',
    '.shs',
    '.lnk',
    '.url',
    '.dll',
    '.sys',
    '.drv',
    '.ocx',
    '.php',
    '.phtml',
    '.php3',
    '.php4',
    '.php5',
    '.php7',
    '.phps',
    '.cgi',
    '.pl',
    '.asp',
    '.aspx',
    '.cer',
    '.asa',
    '.htaccess',
    '.htpasswd',
  ])

  private static readonly ALLOWED_IMAGE_EXTENSIONS = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
    '.ico',
    '.bmp',
  ])

  private static readonly ALLOWED_DOCUMENT_EXTENSIONS = new Set([
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.csv',
    '.txt',
  ])

  static sanitizeFilename(filename: string): string {
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(filename)) {
        throw new Error(`Invalid filename: contains dangerous characters`)
      }
    }

    const ext = path.extname(filename).toLowerCase()
    if (this.BLOCKED_EXTENSIONS.has(ext)) {
      throw new Error(`File type not allowed: ${ext}`)
    }

    // Sanitize: replace special chars with underscores, trim
    return filename
      .replace(/[^\w\s.\-()]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 255)
  }

  /**
   * Validate that a file is an allowed image type.
   */
  static isAllowedImage(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase()
    return this.ALLOWED_IMAGE_EXTENSIONS.has(ext)
  }

  /**
   * Validate that a file is an allowed document type.
   */
  static isAllowedDocument(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase()
    return this.ALLOWED_DOCUMENT_EXTENSIONS.has(ext)
  }
}
