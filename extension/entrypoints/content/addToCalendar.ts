import { getImportMetadata } from './importMetadata';
import { previewUploadedSchedule } from '@/lib/client/sdk.gen';
import type { DualSchedule } from '@/lib/client/types.gen';
import { client } from '../../lib/client/client.gen';
import { browser } from 'wxt/browser';

export { addParsedScheduleToCanvas } from './canvasSession';

const apiUrl = import.meta.env.WXT_API_URL ?? 'http://localhost:8000';
const parserTimeoutMs = 30_000;

client.setConfig({
  baseUrl: apiUrl,
  credentials: 'omit',
});


function getCanvasBaseUrl(): string {
  return window.location.origin;
}

function getCanvasPdfDownloadUrl(fileId: string): string {
  return `${getCanvasBaseUrl()}/files/${fileId}/download`;
}

function getCanvasFileId(url = window.location.href): string | null {
  return new URL(url).pathname.match(/\/files\/(\d+)/)?.[1] ?? null
}

export async function handleAddToCalendar(): Promise<DualSchedule> {
  const metadataPromise = getImportMetadata();
  const pdfResponse = await fetch(getCanvasPdfDownloadUrl(getCanvasFileId() ?? ''), {
    credentials: 'include',
  })

  if (!pdfResponse.ok) {
    throw new Error(`Failed to download Canvas file ${getCanvasFileId()}: ${pdfResponse.status}`)
  }

  const pdfBlob = await pdfResponse.blob()
  const metadata = await metadataPromise;
  const file = new File([pdfBlob], metadata.filename ?? 'schedule', { type: pdfBlob.type });

  const { data: schedule, response } = await previewUploadedSchedule({
    body: {
      pdf: file,
      metadata: JSON.stringify({ ...metadata, extension_version: browser.runtime.getManifest().version }),
    },
    signal: AbortSignal.timeout(parserTimeoutMs),
  })

  if (!response) {
    throw new Error(`The schedule parser at ${apiUrl} did not respond within 30 seconds.`)
  }

  if (!response.ok) {
    throw new Error(`The schedule parser returned HTTP ${response.status}.`)
  }

  if (!schedule) {
    throw new Error('Failed to parse schedule')
  }

  return schedule
}
