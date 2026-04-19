import { previewUploadedSchedule } from '@/lib/client/sdk.gen';
import { client } from '../../lib/client/client.gen';

client.setConfig({
  baseUrl: import.meta.env.WXT_API_URL ?? 'http://localhost:8000',
  credentials: 'include',
});


function getCanvasPdfDownloadUrl(fileId: string): string {
  return `${window.location.origin}/files/${fileId}/download`
}

function getCanvasFileId(url = window.location.href): string | null {
  return new URL(url).pathname.match(/\/files\/(\d+)/)?.[1] ?? null
}

export async function handleAddToCalendar() {
  const pdfResponse = await fetch(getCanvasPdfDownloadUrl(getCanvasFileId() ?? ''), {
    credentials: 'include',
  })

  if (!pdfResponse.ok) {
    throw new Error(`Failed to download Canvas file ${getCanvasFileId()}: ${pdfResponse.status}`)
  }

  const pdfBlob = await pdfResponse.blob()

  const { data: schedule } = await previewUploadedSchedule({
    body: { pdf: pdfBlob },
    throwOnError: true,
  })

  console.log('Parsed schedule:', schedule)

  alert(`Button clicked!\nFile ID: ${getCanvasFileId()}`)
}
