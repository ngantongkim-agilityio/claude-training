import { PdfService } from '../services/pdf.service'
import { InvoiceReportSummary } from '../report.dto'

jest.mock('@/configs', () => ({
  createModuleLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
  }),
}))

describe('PdfService', () => {
  let pdfService: PdfService

  beforeEach(() => {
    pdfService = new PdfService()
  })

  const mockSummary: InvoiceReportSummary = {
    totalInvoices: 2,
    totalAmount: 3000,
    totalTax: 300,
    draftCount: 1,
    submittedCount: 1,
    approvedCount: 0,
    rejectedCount: 0,
  }

  const mockInvoices = [
    {
      invoiceNumber: 'INV-001',
      user: 'user@example.com',
      status: 'submitted',
      amount: 1000,
      tax: 100,
      createdAt: new Date('2025-07-10'),
    },
    {
      invoiceNumber: 'INV-002',
      user: 'user@example.com',
      status: 'draft',
      amount: 2000,
      tax: 200,
      createdAt: new Date('2025-07-12'),
    },
  ]

  it('should generate a PDF buffer', async () => {
    const buffer = await pdfService.generateInvoiceReportPdf({
      from: '2025-07-01',
      to: '2025-07-31',
      summary: mockSummary,
      invoices: mockInvoices,
    })

    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
    // PDF magic bytes
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF')
  })

  it('should generate PDF with status filter in header', async () => {
    const buffer = await pdfService.generateInvoiceReportPdf({
      from: '2025-07-01',
      to: '2025-07-31',
      status: 'submitted',
      summary: mockSummary,
      invoices: mockInvoices,
    })

    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('should handle empty invoices', async () => {
    const buffer = await pdfService.generateInvoiceReportPdf({
      from: '2025-07-01',
      to: '2025-07-31',
      summary: { ...mockSummary, totalInvoices: 0 },
      invoices: [],
    })

    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('should handle invoices with no tax', async () => {
    const buffer = await pdfService.generateInvoiceReportPdf({
      from: '2025-07-01',
      to: '2025-07-31',
      summary: mockSummary,
      invoices: [
        {
          invoiceNumber: 'INV-003',
          user: 'user@example.com',
          status: 'draft',
          amount: 500,
          createdAt: new Date('2025-07-15'),
        },
      ],
    })

    expect(buffer).toBeInstanceOf(Buffer)
  })
})
