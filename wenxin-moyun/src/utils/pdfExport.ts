/**
 * PDF Export Utility
 *
 * Uses browser's native print functionality for high-quality PDF generation.
 * This approach is more reliable than JS libraries and produces better output.
 */

export interface PDFExportOptions {
  title?: string;
  filename?: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Trigger browser print dialog for PDF export.
 * User can choose "Save as PDF" from the print dialog.
 */
export function exportToPDF(options: PDFExportOptions = {}): void {
  const { title } = options;

  // Store original title
  const originalTitle = document.title;

  // Set document title for PDF filename
  if (title) {
    document.title = title;
  }

  // Add print-mode class to body for print-specific styles
  document.body.classList.add('printing-pdf');

  // Trigger print
  window.print();

  // Restore original state after print dialog
  setTimeout(() => {
    document.body.classList.remove('printing-pdf');
    if (title) {
      document.title = originalTitle;
    }
  }, 100);
}

/**
 * Check if the page is being printed
 */
export function useIsPrinting(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('print').matches;
}

/**
 * Generate a filename for the PDF export
 */
export function generatePDFFilename(modelName: string, reportType: string = 'report'): string {
  const date = new Date().toISOString().split('T')[0];
  const sanitizedName = modelName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  return `vulca-${sanitizedName}-${reportType}-${date}.pdf`;
}

/**
 * Sample report URLs
 * HTML version can be printed to PDF by users
 * PDF version is the pre-generated file (if available)
 */
export const SAMPLE_REPORT_HTML_URL = '/sample-reports/sample-report.html';
export const SAMPLE_REPORT_PDF_URL = '/sample-reports/vulca-sample-report-2025.pdf';

/**
 * Open sample report in new tab (HTML version for printing)
 * Users can use browser's "Print to PDF" feature
 */
export function openSampleReport(): void {
  window.open(SAMPLE_REPORT_HTML_URL, '_blank');
}

/**
 * Download sample report
 * Tries PDF first, falls back to opening HTML version
 */
export async function downloadSampleReport(): Promise<void> {
  try {
    // Try to fetch PDF first
    const response = await fetch(SAMPLE_REPORT_PDF_URL, { method: 'HEAD' });
    if (response.ok) {
      // PDF exists, download it
      const link = document.createElement('a');
      link.href = SAMPLE_REPORT_PDF_URL;
      link.download = 'vulca-sample-report-2025.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
  } catch {
    // PDF not available
  }

  // Fallback: open HTML version (user can print to PDF)
  openSampleReport();
}

/**
 * Check if sample report is available (either version)
 */
export async function checkSampleReportAvailable(): Promise<boolean> {
  try {
    // Check HTML version (always available if deployed)
    const htmlResponse = await fetch(SAMPLE_REPORT_HTML_URL, { method: 'HEAD' });
    if (htmlResponse.ok) return true;

    // Check PDF version
    const pdfResponse = await fetch(SAMPLE_REPORT_PDF_URL, { method: 'HEAD' });
    return pdfResponse.ok;
  } catch {
    return false;
  }
}
