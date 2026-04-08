import type { OcrProvider, OcrReceiptResult } from '#services/ocr/ocr_provider'

export default class MockOcrProvider implements OcrProvider {
  async parseReceipt(_fileBuffer: Buffer, _mimeType: string): Promise<OcrReceiptResult> {
    const suppliers = [
      'Amazon',
      'FNAC',
      'Boulanger',
      'Leroy Merlin',
      'Office Depot',
      'Bureau Vallée',
      'Darty',
      'Total Energies',
      'SNCF',
      'Air France',
    ]
    const descriptions = [
      'Fournitures de bureau',
      'Matériel informatique',
      'Frais de déplacement',
      'Repas professionnel',
      'Abonnement logiciel',
      'Consommables',
    ]

    const amount = Math.round((Math.random() * 200 + 10) * 100) / 100
    const vatRate = [0, 5.5, 10, 20][Math.floor(Math.random() * 4)]
    const vatAmount = Math.round(amount * (vatRate / 100) * 100) / 100

    return {
      supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      amount,
      vatAmount,
      vatRate,
      currency: 'EUR',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: Math.random() > 0.5 ? 'card' : 'cash',
      confidence: Math.round((Math.random() * 30 + 70) * 100) / 100,
    }
  }
}
