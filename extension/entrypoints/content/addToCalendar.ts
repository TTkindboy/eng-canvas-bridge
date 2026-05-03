import { addScheduleToCanvas, previewUploadedSchedule } from '@/lib/client/sdk.gen';
import type { Eng10Schedule } from '@/lib/client/types.gen';
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


export async function handleAddToCalendar(): Promise<Eng10Schedule> {
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

  if (!schedule) {
    throw new Error('Failed to parse schedule')
  }

  console.log('Parsed schedule:', schedule)
  return schedule
}

export type SectionAssignments = Record<string, 'odd' | 'even'>;

export async function addAssignedScheduleToCanvas(schedule: Eng10Schedule, assignments: SectionAssignments) {
  const assignedDays = Array.from(new Set(Object.values(assignments)));

  return await Promise.all(
    assignedDays.map((day) =>
      addScheduleToCanvas({
        body: schedule,
        query: { day, course_id: getCanvasCourseId() },
        throwOnError: true,
      }),
    ),
  );
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
