const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "")

interface BackendCourse {
  id: number | string
  name?: string
  course_code?: string
}

interface BackendFile {
  file_id: number
  title: string
}

export interface CourseOption {
  id: string
  name: string
  courseCode?: string
}

export interface FileOption {
  id: string
  title: string
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)

  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function fetchCourses(): Promise<CourseOption[]> {
  const courses = await fetchJson<BackendCourse[]>("/courses")

  return courses
    .map((course) => ({
      id: String(course.id),
      name: course.name?.trim() || `Course ${course.id}`,
      courseCode: course.course_code?.trim() || undefined,
    }))
    .filter((course) => course.id.length > 0)
}

export async function fetchCourseFiles(courseId: string): Promise<FileOption[]> {
  const files = await fetchJson<BackendFile[]>(`/courses/${courseId}/pdfs`)

  return files
    .map((file) => ({
      id: String(file.file_id),
      title: file.title.trim()
    }))
    .filter((file) => file.id.length > 0)
}
