import type { DualSchedule } from '../../lib/client/types.gen';

export async function addParsedScheduleToCanvas(schedule: DualSchedule, completedNotes: Set<number>) {
  const courseId = window.location.pathname.match(/\/courses\/(\d+)/)?.[1];
  if (!courseId) throw new Error('Open the schedule inside its Canvas course.');

  const notes = [...schedule.odd, ...schedule.even];
  if (notes.some((note) => !note.todo_date || !note.title.trim())) {
    throw new Error('Each schedule entry must have a date and title.');
  }

  for (const [index, note] of notes.entries()) {
    if (completedNotes.has(index)) continue;
    await addPlannerNote(Number(courseId), note.title, note.todo_date!, note.description ?? undefined);
    completedNotes.add(index);
  }
}

async function addPlannerNote(courseId: number, title: string, todoDate: string, details?: string) {
  const csrfToken = decodeURIComponent(document.cookie.match(/(?:^|;\s*)_csrf_token=([^;]+)/)?.[1] ?? '');
  if (!csrfToken) throw new Error('Refresh Canvas to restore your session, then try again.');

  const response = await fetch(`${window.location.origin}/api/v1/planner_notes`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({ course_id: courseId, todo_date: todoDate, title, details }),
  });

  if (!response.ok) throw new Error(`Failed to add planner note: ${response.status}`);
}
