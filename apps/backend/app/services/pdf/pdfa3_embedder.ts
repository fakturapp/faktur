import { PDFDocument, PDFName, PDFHexString, PDFString, PDFArray, PDFDict } from 'pdf-lib'

const FACTURX_FILENAME = 'factur-x.xml'

export async function embedFacturXInPdf(
  pdfBuffer: Buffer,
  xmlContent: string
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer)
  const context = pdfDoc.context

  const xmlBytes = new Uint8Array(Buffer.from(xmlContent, 'utf-8'))

  const paramsRef = context.register(context.obj({
    Size: xmlBytes.length,
    ModDate: PDFString.of(formatPdfDate(new Date())),
  }))

  const streamRef = context.register(context.flateStream(xmlBytes, {
    Type: 'EmbeddedFile',
    Subtype: 'text#2Fxml',
    Params: paramsRef,
  }))

  const fileSpecDict = context.obj({
    Type: PDFName.of('Filespec'),
    F: PDFString.of(FACTURX_FILENAME),
    UF: PDFHexString.fromText(FACTURX_FILENAME),
    Desc: PDFString.of('Factur-X XML invoice data'),
    AFRelationship: PDFName.of('Alternative'),
    EF: context.obj({
      F: streamRef,
      UF: streamRef,
    }),
  })

  const fileSpecRef = context.register(fileSpecDict)

  const nameTree = context.obj({
    Names: [PDFHexString.fromText(FACTURX_FILENAME), fileSpecRef],
  })
  const nameTreeRef = context.register(nameTree)

  const catalog = pdfDoc.catalog

  let namesDict = catalog.lookup(PDFName.of('Names')) as PDFDict | undefined
  if (!namesDict) {
    const newNamesDict = context.obj({})
    const newNamesRef = context.register(newNamesDict)
    catalog.set(PDFName.of('Names'), newNamesRef)
    namesDict = newNamesDict
  }
  namesDict.set(PDFName.of('EmbeddedFiles'), nameTreeRef)

  const existingAF = catalog.lookup(PDFName.of('AF'))
  if (existingAF instanceof PDFArray) {
    existingAF.push(fileSpecRef)
  } else {
    catalog.set(PDFName.of('AF'), context.obj([fileSpecRef]))
  }

  addPdfAMetadata(pdfDoc)

  const resultBytes = await pdfDoc.save()
  return Buffer.from(resultBytes)
}

function addPdfAMetadata(pdfDoc: PDFDocument): void {
  const now = new Date()
  const dateStr = now.toISOString()

  const xmpMetadata = `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:pdf="http://ns.adobe.com/pdf/1.3/"
      xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
      xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">Factur-X Invoice</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:creator>
        <rdf:Seq>
          <rdf:li>FactorPro</rdf:li>
        </rdf:Seq>
      </dc:creator>
      <dc:date>
        <rdf:Seq>
          <rdf:li>${dateStr}</rdf:li>
        </rdf:Seq>
      </dc:date>
      <pdf:Producer>FactorPro / pdf-lib</pdf:Producer>
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
      <fx:DocumentFileName>${FACTURX_FILENAME}</fx:DocumentFileName>
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:ConformanceLevel>EN 16931</fx:ConformanceLevel>
      <fx:Version>1.0</fx:Version>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`

  const metadataBytes = new Uint8Array(Buffer.from(xmpMetadata, 'utf-8'))
  const context = pdfDoc.context

  const metadataRef = context.register(context.stream(metadataBytes, {
    Type: 'Metadata',
    Subtype: 'XML',
  }))
  pdfDoc.catalog.set(PDFName.of('Metadata'), metadataRef)
}

function formatPdfDate(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  const h = String(date.getUTCHours()).padStart(2, '0')
  const min = String(date.getUTCMinutes()).padStart(2, '0')
  const s = String(date.getUTCSeconds()).padStart(2, '0')
  return `D:${y}${m}${d}${h}${min}${s}+00'00'`
}
