import PDFDocument from 'pdfkit'

// Types
import type { InvoiceReportSummary } from '../report.dto'

// Configs
import { createModuleLogger } from '@/configs'

const logger = createModuleLogger('PdfService')

interface InvoiceRow {
  invoiceNumber: string
  user: string
  status: string
  amount: number
  tax?: number
  createdAt?: Date
}

interface ReportPdfData {
  from: string
  to: string
  status?: string
  summary: InvoiceReportSummary
  invoices: InvoiceRow[]
}

export class PdfService {
  /**
   * Generate an invoice report PDF and return it as a Buffer.
   * Streams document chunks into memory, resolving once PDFKit signals end.
   */
  generateInvoiceReportPdf = async (data: ReportPdfData): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' })
      const chunks: Buffer[] = []

      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks)
        logger.info('PDF generated', { size: buffer.length })
        resolve(buffer)
      })
      doc.on('error', reject)

      this.renderHeader(doc, data)
      this.renderSummary(doc, data.summary)
      this.renderInvoiceTable(doc, data.invoices)

      doc.end()
    })
  }

  private renderHeader = (
    doc: PDFKit.PDFDocument,
    data: ReportPdfData,
  ): void => {
    doc.fontSize(18).text('Invoice Report', { align: 'center' })
    doc.moveDown(0.5)

    doc.fontSize(10)
    doc.text(`Date Range: ${data.from} to ${data.to}`)
    if (data.status) {
      doc.text(`Status Filter: ${data.status}`)
    }
    doc.moveDown(1)
  }

  private renderSummary = (
    doc: PDFKit.PDFDocument,
    summary: InvoiceReportSummary,
  ): void => {
    doc.fontSize(14).text('Summary')
    doc.moveDown(0.3)
    doc.fontSize(10)
    doc.text(`Total Invoices: ${summary.totalInvoices}`)
    doc.text(`Total Amount: ${summary.totalAmount.toFixed(2)}`)
    doc.text(`Total Tax: ${summary.totalTax.toFixed(2)}`)
    doc.text(`Draft: ${summary.draftCount}`)
    doc.text(`Submitted: ${summary.submittedCount}`)
    doc.text(`Approved: ${summary.approvedCount}`)
    doc.text(`Rejected: ${summary.rejectedCount}`)
    doc.moveDown(1)
  }

  /**
   * Renders a tabular list of invoices. Handles page overflow
   * by inserting new pages when content approaches the bottom margin.
   */
  private renderInvoiceTable = (
    doc: PDFKit.PDFDocument,
    invoices: InvoiceRow[],
  ): void => {
    doc.fontSize(14).text('Invoices')
    doc.moveDown(0.5)

    if (invoices.length === 0) {
      doc.fontSize(10).text('No invoices found.')
      return
    }

    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right
    // Per-column right-side gaps: wider after numeric columns for readability
    const colGaps = [10, 10, 12, 14, 22]
    const totalGaps = colGaps.reduce((a, b) => a + b, 0)
    const availableWidth = pageWidth - totalGaps
    // Proportional distribution: Invoice#, User, Status, Amount, Tax, Date
    const ratios = [2.6, 2.6, 1.2, 1.3, 1.2, 1.1]
    const totalRatio = ratios.reduce((a, b) => a + b, 0)
    const colWidths = ratios.map((r) =>
      Math.floor((r / totalRatio) * availableWidth),
    )
    const headers = ['Invoice #', 'User', 'Status', 'Amount', 'Tax', 'Date']
    const alignments: ('left' | 'right')[] = [
      'left',
      'left',
      'left',
      'right',
      'right',
      'left',
    ]
    const startX = doc.page.margins.left
    const rowHeight = 14
    const rowPadding = 4
    let y = doc.y

    const getColX = (colIndex: number): number => {
      let x = startX
      for (let i = 0; i < colIndex; i++) {
        x += colWidths[i] + colGaps[i]
      }
      return x
    }

    doc.fontSize(9).font('Helvetica-Bold')
    headers.forEach((header, i) => {
      doc.text(header, getColX(i), y, {
        width: colWidths[i],
        height: 12,
        align: alignments[i],
        lineBreak: false,
        ellipsis: true,
      })
    })

    y += 15
    const tableWidth = colWidths.reduce((a, b) => a + b, 0) + totalGaps
    doc
      .moveTo(startX, y)
      .lineTo(startX + tableWidth, y)
      .stroke()
    y += 5

    doc.font('Helvetica').fontSize(8)
    for (const invoice of invoices) {
      if (y + rowHeight > doc.page.height - 60) {
        doc.addPage()
        y = doc.page.margins.top
      }

      const row = [
        invoice.invoiceNumber,
        invoice.user,
        invoice.status,
        invoice.amount.toFixed(2),
        (invoice.tax ?? 0).toFixed(2),
        invoice.createdAt
          ? new Date(invoice.createdAt).toLocaleDateString()
          : '-',
      ]

      row.forEach((cell, i) => {
        doc.text(cell, getColX(i), y, {
          width: colWidths[i],
          align: alignments[i],
          ellipsis: true,
          lineBreak: false,
        })
      })

      y += rowHeight + rowPadding
    }
  }
}
