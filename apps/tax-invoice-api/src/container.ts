import { AuthController, AuthService } from './modules/auth'
import { UserController, UserRepository, UserService } from './modules/users'
import {
  InvoiceController,
  InvoiceRepository,
  InvoiceService,
  InvoiceV2Controller,
  InvoiceV2Service,
} from './modules/invoices'
import { ReportController, ReportService, PdfService } from './modules/reports'

export const userRepository = new UserRepository()
export const invoiceRepository = new InvoiceRepository()

export const authService = new AuthService()
export const userService = new UserService(userRepository)
export const invoiceService = new InvoiceService(invoiceRepository)
export const invoiceV2Service = new InvoiceV2Service(invoiceRepository)
export const pdfService = new PdfService()
export const reportService = new ReportService(pdfService)

export const authController = new AuthController(authService)
export const userController = new UserController(userService)
export const invoiceController = new InvoiceController(invoiceService)
export const invoiceV2Controller = new InvoiceV2Controller(invoiceV2Service)
export const reportController = new ReportController(reportService)
