import { previewUploadedSchedule } from '@/lib/client/sdk.gen';
import { client } from '../../lib/client/client.gen';

client.setConfig({
  baseUrl: import.meta.env.WXT_API_URL ?? 'http://localhost:8000',
  credentials: 'include',
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

function getCanvasCourseId(url = window.location.href): number | null {
  return Number(new URL(url).pathname.match(/\/courses\/(\d+)/)?.[1]) ?? null
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

  alert(`Button clicked!\nFile ID: ${getCanvasFileId()}\nCourse ID: ${getCanvasCourseId()}`)
  console.log(addPlannerNote(getCanvasCourseId(), 'TEST FROM EXTENSION', '2026-04-21'))
}

async function addPlannerNote(courseId: number | null, title: string, todoDate: string) {
  const csrfToken = decodeURIComponent(document.cookie.match(/_csrf_token=([^;]+)/)?.[1] ?? "");
  const response = await fetch(`${getCanvasBaseUrl()}/api/v1/planner_notes`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify({context_type: "Course", course_id: courseId, todo_date: todoDate, title}),
  });

  if (!response.ok) {
    throw new Error(`Failed to add planner note: ${response.status}`);
  }

  return await response.json();
}
