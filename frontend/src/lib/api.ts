import { client } from '@/lib/client/client.gen'
import { getCourses, getPdfs, previewSchedule, parsePdfToPlanner } from '@/lib/client'
import type { Course, CourseFile, Eng10Schedule, PlannerNote } from '@/lib/client'

client.setConfig({
  baseUrl: (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, ''),
})

export interface CourseOption {
  id: string
  name: string
  courseCode?: string
}

export interface FileOption {
  id: string
  title: string
}

export async function fetchCourses(): Promise<CourseOption[]> {
  const { data } = await getCourses({ throwOnError: true })
  return data
    .map((course: Course) => ({
      id: String(course.id),
      name: course.name.trim() || `Course ${course.id}`,
      courseCode: course.course_code?.trim() || undefined,
    }))
    .filter((course) => course.id.length > 0)
}

export async function fetchCourseFiles(courseId: string): Promise<FileOption[]> {
  const { data } = await getPdfs({
    path: { course_id: Number(courseId) },
    throwOnError: true,
  })
  return data
    .map((file: CourseFile) => ({
      id: String(file.file_id),
      title: file.title.trim(),
    }))
    .filter((file) => file.id.length > 0)
}

export async function fetchSchedulePreview(fileId: string): Promise<Eng10Schedule> {
  const { data } = await previewSchedule({
    path: { file_id: Number(fileId) },
    throwOnError: true,
  })
  return data
}

export async function addToPlannerNotes(
  fileId: string,
  day: 'odd' | 'even',
  courseId?: number,
): Promise<PlannerNote[]> {
  const { data } = await parsePdfToPlanner({
    path: { file_id: Number(fileId) },
    query: { day, course_id: courseId ?? null },
    throwOnError: true,
  })
  return data
}
