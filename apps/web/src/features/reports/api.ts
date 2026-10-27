import { apiClient, getAccessToken } from "@/services/api-client";
import type {
  GetReportParams,
  GetReportResponse,
  EmailReportData,
  EmailReportResponse,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

export const reportService = {
  getReport: (params: GetReportParams) => {
    const searchParams = new URLSearchParams();
    searchParams.set("from", params.from);
    searchParams.set("to", params.to);
    if (params.status) searchParams.set("status", params.status);
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));

    return apiClient<GetReportResponse>(
      `/reports/invoices?${searchParams.toString()}`,
    );
  },

  // Uses raw fetch instead of apiClient because the response is binary (application/pdf).
  // Triggers a browser download via a temporary object URL.
  exportPdf: async (params: GetReportParams) => {
    const token = await getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE_URL}/reports/invoices/pdf`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          from: params.from,
          to: params.to,
          ...(params.status && { status: params.status }),
        }),
      },
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(error.message ?? "Failed to export PDF");
    }

    // Programmatic download: create a temporary <a> with the blob URL
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-report-${params.from}-to-${params.to}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Backend processes this asynchronously via BullMQ — returns a jobId for tracking
  sendEmail: (data: EmailReportData) =>
    apiClient<EmailReportResponse>("/reports/invoices/email", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
