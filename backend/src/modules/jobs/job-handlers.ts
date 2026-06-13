import { AppError } from '../../shared/http/errors.js';
import { sepayContextForShop, withSepayRetry } from '../sepay/sepay.service.js';
import { assertProviderTemplateSeriesAvailable } from '../sepay/provider-template-rules.js';
import { buildPollResult } from '../sepay/sepay-response-utils.js';
import { downloadInvoiceNormalized } from '../sepay/sepay-download.service.js';
import { SEPAY_ERROR_CODES } from '../sepay/sepay.errors.js';
import { enqueueAutoIssueIfAllowed, getInvoiceJob, updateInvoiceJobStatus } from '../invoices/invoice-job.service.js';

type ProviderResponse = Record<string, unknown>;

export async function handleCreateDraft(tenantId: string, invoiceJobId: string) {
  const invoiceJob = await getInvoiceJob(tenantId, invoiceJobId);

  const context = await sepayContextForShop(tenantId, invoiceJob.tenant_shop_id);
  try {
    await assertProviderTemplateSeriesAvailable(context.client, invoiceJob.request_payload_json as { provider_account_id?: string; template_code?: string; invoice_series?: string });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateInvoiceJobStatus(tenantId, invoiceJobId, {
      status: 'failed',
      errorJson: { message, code: SEPAY_ERROR_CODES.TEMPLATE_VALIDATION_FAILED }
    });
    return;
  }

  const response = await withSepayRetry(tenantId, invoiceJob.tenant_shop_id, client =>
    client.createInvoice({ ...invoiceJob.request_payload_json, is_draft: true })
  ) as ProviderResponse;

  const pollResult = buildPollResult(response);
  if (pollResult.success || pollResult.referenceCode) {
    const updated = await updateInvoiceJobStatus(tenantId, invoiceJobId, {
      status: 'draft_created',
      sepayCreateTrackingCode: pollResult.trackingCode || null,
      sepayReferenceCode: pollResult.referenceCode || null,
      responseJson: { create: response }
    });
    await tryAutoIssue(tenantId, invoiceJobId);
    return updated;
  }

  if (!pollResult.trackingCode) {
    return updateInvoiceJobStatus(tenantId, invoiceJobId, {
      status: 'failed',
      responseJson: { create: response },
      errorJson: { message: pollResult.message || 'No tracking code returned from SePay', code: SEPAY_ERROR_CODES.CREATE_NO_TRACKING }
    });
  }

  const checkedResponse = await shortPollCreate(context, pollResult.trackingCode);
  const checkedResult = buildPollResult(checkedResponse);
  if (checkedResult.failed) {
    return updateInvoiceJobStatus(tenantId, invoiceJobId, {
      status: 'failed',
      sepayCreateTrackingCode: pollResult.trackingCode,
      responseJson: { create: response, poll: checkedResponse },
      errorJson: { message: checkedResult.message, code: SEPAY_ERROR_CODES.CREATE_POLL_FAILED }
    });
  }
  if (checkedResult.success || checkedResult.referenceCode) {
    const updated = await updateInvoiceJobStatus(tenantId, invoiceJobId, {
      status: 'draft_created',
      sepayCreateTrackingCode: pollResult.trackingCode,
      sepayReferenceCode: checkedResult.referenceCode || null,
      responseJson: { create: response, poll: checkedResponse }
    });
    await tryAutoIssue(tenantId, invoiceJobId);
    return updated;
  }
  return updateInvoiceJobStatus(tenantId, invoiceJobId, {
    status: 'draft_create_polling',
    sepayCreateTrackingCode: pollResult.trackingCode,
    responseJson: { create: response, poll: checkedResponse }
  });
}

async function shortPollCreate(context: Awaited<ReturnType<typeof sepayContextForShop>>, trackingCode: string): Promise<unknown> {
  const maxAttempts = 5;
  const intervalMs = 1000;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await context.client.checkCreateStatus(trackingCode);
    const result = buildPollResult(response);
    if (result.success || result.failed || result.referenceCode) return response;
    if (attempt < maxAttempts) await delay(intervalMs);
  }
  return {};
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function handlePollCreate(tenantId: string, invoiceJobId: string) {
  const invoiceJob = await getInvoiceJob(tenantId, invoiceJobId);
  if (!invoiceJob.sepay_create_tracking_code) throw new AppError('VALIDATION_ERROR', 'Missing SePay create tracking code', 400);
  const response = await withSepayRetry(tenantId, invoiceJob.tenant_shop_id, client => client.checkCreateStatus(invoiceJob.sepay_create_tracking_code!)) as ProviderResponse;
  const result = buildPollResult(response);
  const updated = await updateInvoiceJobStatus(tenantId, invoiceJobId, {
    status: result.success || result.referenceCode ? 'draft_created' : result.failed ? 'failed' : 'draft_create_polling',
    sepayReferenceCode: result.referenceCode || null,
    responseJson: { check_create: response },
    errorJson: result.failed ? { message: result.message, code: SEPAY_ERROR_CODES.CREATE_POLL_FAILED } : null
  });
  if (updated.status === 'draft_created') await tryAutoIssue(tenantId, invoiceJobId);
  return updated;
}

async function tryAutoIssue(tenantId: string, invoiceJobId: string): Promise<void> {
  await enqueueAutoIssueIfAllowed({ tenantId, invoiceJobId }).catch(() => undefined);
}

export async function handleIssue(tenantId: string, invoiceJobId: string) {
  const invoiceJob = await getInvoiceJob(tenantId, invoiceJobId);
  if (!invoiceJob.sepay_reference_code) {
    throw new AppError('VALIDATION_ERROR', 'Invoice has no SePay reference code. Please check status and ensure draft was created before issuing.', 400);
  }
  const response = await withSepayRetry(tenantId, invoiceJob.tenant_shop_id, client => client.issueInvoice(invoiceJob.sepay_reference_code!)) as ProviderResponse;
  const pollResult = buildPollResult(response);
  if (!pollResult.trackingCode) {
    return updateInvoiceJobStatus(tenantId, invoiceJobId, {
      status: 'failed',
      responseJson: { issue: response },
      errorJson: { message: pollResult.message || 'No tracking code returned from SePay', code: SEPAY_ERROR_CODES.ISSUE_NO_TRACKING }
    });
  }
  const context = await sepayContextForShop(tenantId, invoiceJob.tenant_shop_id);
  const checkedResponse = await shortPollIssue(context, pollResult.trackingCode);
  const checkedResult = buildPollResult(checkedResponse);
  if (checkedResult.success) {
    return updateInvoiceJobStatus(tenantId, invoiceJobId, {
      status: 'issued',
      sepayIssueTrackingCode: pollResult.trackingCode,
      invoiceNumber: checkedResult.invoiceNumber || null,
      downloadAvailable: true,
      issuedAt: new Date(),
      responseJson: { issue: response, poll: checkedResponse }
    });
  }
  if (checkedResult.failed) {
    return updateInvoiceJobStatus(tenantId, invoiceJobId, {
      status: 'failed',
      sepayIssueTrackingCode: pollResult.trackingCode,
      responseJson: { issue: response, poll: checkedResponse },
      errorJson: { message: checkedResult.message, code: SEPAY_ERROR_CODES.ISSUE_POLL_FAILED }
    });
  }
  return updateInvoiceJobStatus(tenantId, invoiceJobId, {
    status: 'issue_polling',
    sepayIssueTrackingCode: pollResult.trackingCode,
    responseJson: { issue: response, poll: checkedResponse }
  });
}

async function shortPollIssue(context: Awaited<ReturnType<typeof sepayContextForShop>>, trackingCode: string): Promise<unknown> {
  const maxAttempts = 5;
  const intervalMs = 1000;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await context.client.checkIssueStatus(trackingCode);
    const result = buildPollResult(response);
    if (result.success || result.failed || result.invoiceNumber) return response;
    if (attempt < maxAttempts) await delay(intervalMs);
  }
  return {};
}

export async function handlePollIssue(tenantId: string, invoiceJobId: string) {
  const invoiceJob = await getInvoiceJob(tenantId, invoiceJobId);
  if (!invoiceJob.sepay_issue_tracking_code) throw new AppError('VALIDATION_ERROR', 'Missing SePay issue tracking code', 400);
  const response = await withSepayRetry(tenantId, invoiceJob.tenant_shop_id, client => client.checkIssueStatus(invoiceJob.sepay_issue_tracking_code!)) as ProviderResponse;
  const result = buildPollResult(response);
  return updateInvoiceJobStatus(tenantId, invoiceJobId, {
    status: result.success || result.invoiceNumber ? 'issued' : result.failed ? 'failed' : 'issue_polling',
    invoiceNumber: result.invoiceNumber || null,
    responseJson: { check_issue: response },
    downloadAvailable: result.success || result.invoiceNumber ? true : null,
    issuedAt: result.success || result.invoiceNumber ? new Date() : null,
    errorJson: result.failed ? { message: result.message, code: SEPAY_ERROR_CODES.ISSUE_POLL_FAILED } : null
  });
}

export async function downloadInvoiceArtifact(tenantId: string, invoiceJobId: string, type: 'pdf' | 'xml') {
  const invoiceJob = await getInvoiceJob(tenantId, invoiceJobId);
  if (!invoiceJob.sepay_reference_code) throw new AppError('VALIDATION_ERROR', 'Missing SePay reference code', 400);
  if (invoiceJob.status !== 'issued') {
    throw new AppError('VALIDATION_ERROR', 'Invoice has not been issued yet. Please issue the invoice before downloading.', 400);
  }
  const context = await sepayContextForShop(tenantId, invoiceJob.tenant_shop_id);
  return downloadInvoiceNormalized(context.client, invoiceJob.sepay_reference_code, type);
}

export async function handleRefresh(tenantId: string, invoiceJobId: string) {
  const invoiceJob = await getInvoiceJob(tenantId, invoiceJobId);
  const patch: Record<string, unknown> = { responseJson: {} };

  if (invoiceJob.status === 'draft_create_polling' && invoiceJob.sepay_create_tracking_code) {
    const createResponse = await withSepayRetry(tenantId, invoiceJob.tenant_shop_id, client =>
      client.checkCreateStatus(invoiceJob.sepay_create_tracking_code!)
    ) as ProviderResponse;
    const createResult = buildPollResult(createResponse);
    patch.status = createResult.success || createResult.referenceCode ? 'draft_created' : createResult.failed ? 'failed' : 'draft_create_polling';
    if (createResult.referenceCode) patch.sepayReferenceCode = createResult.referenceCode;
    if (createResult.trackingCode) patch.sepayCreateTrackingCode = createResult.trackingCode;
    patch.responseJson = { refresh_create: createResponse };
    if (createResult.failed) patch.errorJson = { message: createResult.message, code: SEPAY_ERROR_CODES.REFRESH_CREATE_FAILED };
  }

  if (invoiceJob.status === 'issue_polling' && invoiceJob.sepay_issue_tracking_code) {
    const issueResponse = await withSepayRetry(tenantId, invoiceJob.tenant_shop_id, client =>
      client.checkIssueStatus(invoiceJob.sepay_issue_tracking_code!)
    ) as ProviderResponse;
    const issueResult = buildPollResult(issueResponse);
    patch.status = issueResult.success ? 'issued' : issueResult.failed ? 'failed' : 'issue_polling';
    if (issueResult.invoiceNumber) patch.invoiceNumber = issueResult.invoiceNumber;
    if (issueResult.trackingCode) patch.sepayIssueTrackingCode = issueResult.trackingCode;
    if (issueResult.success) {
      patch.downloadAvailable = true;
      patch.issuedAt = new Date();
    }
    patch.responseJson = { ...((patch.responseJson as Record<string, unknown>) ?? {}), refresh_issue: issueResponse };
    if (issueResult.failed) patch.errorJson = { message: issueResult.message, code: SEPAY_ERROR_CODES.REFRESH_ISSUE_FAILED };
  }

  if (invoiceJob.sepay_reference_code) {
    const invoiceResponse = await withSepayRetry(tenantId, invoiceJob.tenant_shop_id, client =>
      client.getInvoice(invoiceJob.sepay_reference_code!)
    ) as ProviderResponse;
    const invoiceResult = buildPollResult(invoiceResponse);
    if (invoiceResult.invoiceNumber) patch.invoiceNumber = invoiceResult.invoiceNumber;
    patch.responseJson = { ...((patch.responseJson as Record<string, unknown>) ?? {}), refresh_invoice: invoiceResponse };
  }

  return updateInvoiceJobStatus(tenantId, invoiceJobId, patch);
}
