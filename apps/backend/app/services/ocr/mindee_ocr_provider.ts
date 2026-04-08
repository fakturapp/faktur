import type { OcrProvider, OcrReceiptResult } from '#services/ocr/ocr_provider'
import env from '#start/env'

export default class MindeeOcrProvider implements OcrProvider {
  private apiKey: string

  constructor() {
    this.apiKey = env.get('MINDEE_API_KEY', '')
  }

  async parseReceipt(fileBuffer: Buffer, mimeType: string): Promise<OcrReceiptResult> {
    if (!this.apiKey) {
      throw new Error('MINDEE_API_KEY is not configured')
    }

    const formData = new FormData()
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    ) as ArrayBuffer
    const blob = new Blob([arrayBuffer], { type: mimeType })
    formData.append('document', blob, 'receipt.jpg')

    const res = await fetch(
      'https://api.mindee.net/v1/products/mindee/expense_receipts/v5/predict',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${this.apiKey}`,
        },
        body: formData,
      }
    )

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Mindee API error: ${res.status} ${text}`)
    }

    const json = (await res.json()) as any
    const prediction = json?.document?.inference?.prediction

    if (!prediction) {
      return {
        supplier: null,
        description: null,
        amount: null,
        vatAmount: null,
        vatRate: null,
        currency: null,
        date: null,
        paymentMethod: null,
        confidence: 0,
      }
    }

    const totalAmount = prediction.total_amount?.value ?? null
    const totalTax = prediction.total_tax?.value ?? null
    const vatRate =
      totalAmount && totalTax && totalAmount > 0
        ? Math.round((totalTax / (totalAmount - totalTax)) * 10000) / 100
        : null

    return {
      supplier: prediction.supplier_name?.value ?? null,
      description: prediction.category?.value ?? null,
      amount:
        totalAmount !== null && totalAmount !== undefined ? totalAmount - (totalTax ?? 0) : null,
      vatAmount: totalTax,
      vatRate,
      currency: prediction.locale?.currency ?? 'EUR',
      date: prediction.date?.value ?? null,
      paymentMethod: null,
      confidence: prediction.total_amount?.confidence ?? 0,
    }
  }
}
