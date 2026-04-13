import { useState, useEffect } from "react"
import { CourseStep } from "@/components/course-step"
import { FileStep } from "@/components/file-step"
import { SchedulePreviewStep } from "@/components/schedule-preview-step"
import { AuthScreen } from "@/components/auth-screen"
import { getCourses } from "@/lib/client"
import type { SelectedFile } from "@/lib/api"

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    getCourses()
      .then(({ response }) => {
        setAuthenticated(response?.ok ?? false)
      })
      .catch(() => {
        setAuthenticated(false)
      })
  }, [])
  const [selectedCourse, setSelectedCourse] = useState<{ id: string; name: string } | undefined>()
  const [selectedFile, setSelectedFile] = useState<SelectedFile | undefined>()

  const handleCourseSelect = (id: string, name: string) => {
    setSelectedCourse({ id, name })
    setSelectedFile(undefined)
  }

  const handleFileSelect = (file: SelectedFile) => {
    setSelectedFile(file)
  }

  const handleBackToCourses = () => {
    setSelectedCourse(undefined)
    setSelectedFile(undefined)
  }

  const handleBackToFiles = () => {
    setSelectedFile(undefined)
  }

  if (authenticated === null) return null
  if (!authenticated) return <AuthScreen onAuthenticated={() => setAuthenticated(true)} />

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {!selectedCourse ? (
          <CourseStep onSelect={handleCourseSelect} />
        ) : !selectedFile ? (
          <FileStep
            courseId={selectedCourse.id}
            courseName={selectedCourse.name}
            onFileSelect={handleFileSelect}
            onBack={handleBackToCourses}
          />
        ) : (
          <SchedulePreviewStep
            selectedFile={selectedFile}
            courseId={selectedCourse.id}
            onBack={handleBackToFiles}
          />
        )}
      </div>
    </main>
  )
}
