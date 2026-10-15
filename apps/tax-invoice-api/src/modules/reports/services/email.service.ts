import nodemailer from 'nodemailer'

// Configs
import { emailConfig, createModuleLogger } from '@/configs'

const logger = createModuleLogger('EmailService')

export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
      auth:
        emailConfig.auth.user && emailConfig.auth.pass
          ? emailConfig.auth
          : undefined,
    })
  }

  /**
   * Send an invoice report PDF as an email attachment via SMTP.
   * Auth credentials are optional — allows local dev with tools like Mailpit.
   */
  sendReportEmail = async ({
    to,
    subject,
    pdfBuffer,
    filename,
  }: {
    to: string
    subject: string
    pdfBuffer: Buffer
    filename: string
  }): Promise<void> => {
    await this.transporter.sendMail({
      from: emailConfig.from,
      to,
      subject,
      text: `Please find the attached invoice report: ${filename}`,
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    })

    logger.info('Report email sent', { to, filename })
  }
}
