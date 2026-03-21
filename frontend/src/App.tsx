import { useState } from "react"
import { CourseStep } from "@/components/course-step"
import { FileStep } from "@/components/file-step"
import { SchedulePreviewStep } from "@/components/schedule-preview-step"

export default function App() {
  const [selectedCourse, setSelectedCourse] = useState<{ id: string; name: string } | undefined>()
  const [selectedFile, setSelectedFile] = useState<{ id: string; title: string } | undefined>()

  const handleCourseSelect = (id: string, name: string) => {
    setSelectedCourse({ id, name })
    setSelectedFile(undefined)
  }

  const handleFileSelect = (id: string, title: string) => {
    setSelectedFile({ id, title })
  }

  const handleBackToCourses = () => {
    setSelectedCourse(undefined)
    setSelectedFile(undefined)
  }

  const handleBackToFiles = () => {
    setSelectedFile(undefined)
  }

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
            fileId={selectedFile.id}
            fileTitle={selectedFile.title}
            courseId={selectedCourse.id}
            courseName={selectedCourse.name}
            onBack={handleBackToFiles}
          />
        )}
      </div>
    </main>
  )
}
