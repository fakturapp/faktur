import type Product from '#models/product/product'
import publicIdCodec from '#services/api/public_id_codec'

export interface ApiProductShape {
  id: string
  name: string
  description: string | null
  unit_price_cents: number
  vat_rate: string
  unit: string | null
  sale_type: string | null
  reference: string | null
  is_archived: boolean
  created_at: string
  updated_at: string | null
}

class ApiProductTransformer {
  transform(product: Product): ApiProductShape {
    return {
      id: publicIdCodec.encode('product', product.id),
      name: product.name,
      description: product.description,
      unit_price_cents: Math.round(Number(product.unitPrice) * 100),
      vat_rate: product.vatRate,
      unit: product.unit,
      sale_type: product.saleType,
      reference: product.reference,
      is_archived: product.isArchived,
      created_at: product.createdAt.toISO() ?? '',
      updated_at: product.updatedAt?.toISO() ?? null,
    }
  }

  transformMany(products: Product[]): ApiProductShape[] {
    return products.map((p) => this.transform(p))
  }
}

export default new ApiProductTransformer()
