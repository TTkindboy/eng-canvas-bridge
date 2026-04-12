import { client } from '@/lib/client/client.gen'
import { getCourses, getPdfs, previewSchedule, previewUploadedSchedule } from '@/lib/client'
import type { Course, CourseFile, Eng10Schedule } from '@/lib/client'
// TODO: switch most bindings to be direct
export { addScheduleToCanvas } from '@/lib/client';
export type { PlannerNote } from '@/lib/client'


client.setConfig({
  baseUrl: import.meta.env.PROD ? import.meta.env.VITE_API_URL : '/api',
  credentials: import.meta.env.PROD ? 'include' : 'same-origin',
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

export type SelectedFile =
  | {
      source: 'canvas'
      id: string
      title: string
    }
  | {
      source: 'upload'
      title: string
      file: File
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

export async function fetchSchedulePreview(file: SelectedFile): Promise<Eng10Schedule> {
  if (file.source === 'canvas') {
    const { data } = await previewSchedule({
      path: { file_id: Number(file.id) },
      throwOnError: true,
    })
    return data
  } else {
    const { data } = await previewUploadedSchedule({
      body: { pdf: file.file },
      throwOnError: true,
    })
    return data
  }
}
