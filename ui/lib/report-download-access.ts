export const REPORT_DOWNLOAD_LOCKED_ERROR =
  "Report downloads require an active subscription.";

/**
 * Whether the current tenant must upgrade before downloading reports.
 * Self-hosted deployments never lock downloads; the HorizonVigil overlay
 * replaces this body with its billing lookup.
 */
export const isReportDownloadLocked = (): Promise<boolean> =>
  Promise.resolve(false);
