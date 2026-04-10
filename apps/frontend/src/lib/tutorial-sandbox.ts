const STORAGE_KEY = 'faktur_tutorial'
const DATA_KEY = 'faktur_tutorial_data'

export function isTutorialActive(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const state = JSON.parse(raw)
    return state?.active === true
  } catch {
    return false
  }
}


interface SandboxData {
  clients: any[]
  products: any[]
  invoices: any[]
  quotes: any[]
  expenses: any[]
}

function loadData(): SandboxData {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { clients: [], products: [], invoices: [], quotes: [], expenses: [] }
}

function saveData(data: SandboxData) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data))
}

function uuid(): string {
  return crypto.randomUUID()
}

export const PREFILL_DATA = {
  company: {
    name: 'Acme Design Studio',
    siren: '123456789',
    siret: '12345678900014',
    vatNumber: 'FR12345678901',
    address: '42 Rue de la Créativité',
    postalCode: '75001',
    city: 'Paris',
    country: 'FR',
    phone: '+33 1 23 45 67 89',
    email: 'contact@acme-design.fr',
    iban: 'FR76 1234 5678 9012 3456 7890 123',
    bic: 'BNPAFRPP',
  },
  client: {
    type: 'company' as const,
    companyName: 'Tech Solutions SAS',
    siren: '987654321',
    siret: '98765432100012',
    vatNumber: 'FR98765432101',
    firstName: '',
    lastName: '',
    email: 'facturation@tech-solutions.fr',
    phone: '+33 4 56 78 90 12',
    address: '15 Avenue de l\'Innovation',
    postalCode: '69001',
    city: 'Lyon',
    country: 'FR',
    includeInEmails: true,
    notes: '',
  },
  product: {
    name: 'Création site web',
    description: 'Conception et développement d\'un site web responsive avec CMS',
    unitPrice: '1500',
    vatRate: '20',
    unit: 'forfait',
  },
  invoice: {
    clientName: 'Tech Solutions SAS',
    lines: [
      { description: 'Création site web', quantity: 1, unitPrice: 1500, vatRate: 20 },
      { description: 'Hébergement annuel', quantity: 1, unitPrice: 120, vatRate: 20 },
    ],
  },
  quote: {
    clientName: 'Tech Solutions SAS',
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    lines: [
      { description: 'Refonte identité visuelle', quantity: 1, unitPrice: 2500, vatRate: 20 },
      { description: 'Déclinaison papeterie', quantity: 1, unitPrice: 800, vatRate: 20 },
    ],
  },
}

type ApiResult<T> = { data?: T; error?: string }

export function tutorialIntercept<T>(
  endpoint: string,
  options: RequestInit
): ApiResult<T> | null {
  if (!isTutorialActive()) return null

  const method = (options.method || 'GET').toUpperCase()
  const body = options.body ? JSON.parse(options.body as string) : null

  if (endpoint === '/clients' && method === 'POST') {
    const data = loadData()
    const client = { id: uuid(), ...body, createdAt: new Date().toISOString(), invoiceCount: 0, quoteCount: 0, totalRevenue: 0 }
    data.clients.push(client)
    saveData(data)
    return { data: { client } as T }
  }

  if (endpoint === '/clients' && method === 'GET') {
    const data = loadData()
    return { data: { clients: data.clients, meta: { total: data.clients.length, page: 1, perPage: 20, lastPage: 1 } } as T }
  }

  if (endpoint.startsWith('/clients/') && method === 'GET') {
    const id = endpoint.split('/')[2]
    const data = loadData()
    const client = data.clients.find((c) => c.id === id)
    return client ? { data: { client } as T } : { error: 'Client non trouvé' }
  }

  if (endpoint.startsWith('/clients/') && method === 'PUT') {
    const id = endpoint.split('/')[2]
    const data = loadData()
    const idx = data.clients.findIndex((c) => c.id === id)
    if (idx >= 0) { data.clients[idx] = { ...data.clients[idx], ...body }; saveData(data) }
    return { data: {} as T }
  }

  if (endpoint === '/products' && method === 'POST') {
    const data = loadData()
    const product = { id: uuid(), ...body, createdAt: new Date().toISOString() }
    data.products.push(product)
    saveData(data)
    return { data: { product } as T }
  }

  if (endpoint === '/products' && method === 'GET') {
    const data = loadData()
    return { data: { products: data.products, meta: { total: data.products.length, page: 1, perPage: 20, lastPage: 1 } } as T }
  }

  if (endpoint === '/invoices' && method === 'POST') {
    const data = loadData()
    const invoice = { id: uuid(), ...body, status: 'draft', number: `FAC-DEMO-${String(data.invoices.length + 1).padStart(3, '0')}`, createdAt: new Date().toISOString() }
    data.invoices.push(invoice)
    saveData(data)
    return { data: { invoice } as T }
  }

  if (endpoint === '/invoices' && method === 'GET') {
    const data = loadData()
    return { data: { invoices: data.invoices, meta: { total: data.invoices.length, page: 1, perPage: 20, lastPage: 1 } } as T }
  }

  if (endpoint.startsWith('/invoices/') && (method === 'PATCH' || method === 'PUT')) {
    const id = endpoint.split('/')[2]
    const data = loadData()
    const idx = data.invoices.findIndex((i) => i.id === id)
    if (idx >= 0) { data.invoices[idx] = { ...data.invoices[idx], ...body }; saveData(data) }
    return { data: {} as T }
  }

  if (endpoint === '/quotes' && method === 'POST') {
    const data = loadData()
    const quote = { id: uuid(), ...body, status: 'draft', number: `DEV-DEMO-${String(data.quotes.length + 1).padStart(3, '0')}`, createdAt: new Date().toISOString() }
    data.quotes.push(quote)
    saveData(data)
    return { data: { quote } as T }
  }

  if (endpoint === '/quotes' && method === 'GET') {
    const data = loadData()
    return { data: { quotes: data.quotes, meta: { total: data.quotes.length, page: 1, perPage: 20, lastPage: 1 } } as T }
  }

  if (endpoint === '/expenses' && method === 'POST') {
    const data = loadData()
    const expense = { id: uuid(), ...body, createdAt: new Date().toISOString() }
    data.expenses.push(expense)
    saveData(data)
    return { data: { expense } as T }
  }

  if (endpoint.includes('/send') && method === 'POST') {
    return { data: { success: true, message: 'Email simulé - non envoyé en mode didacticiel' } as T }
  }

  if (endpoint === '/dashboard/sidebar-counts' && method === 'GET') {
    return { data: { quoteDrafts: 0, invoiceDrafts: 0 } as T }
  }

  if (endpoint === '/team/switch' && method === 'POST') {
    return { error: 'Changement d\'équipe désactivé en mode didacticiel' }
  }

  return null
}
