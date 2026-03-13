import { useState } from "react"
import { CourseStep } from "@/components/course-step"
import { FileStep } from "@/components/file-step"

export default function App() {
  const [selectedCourse, setSelectedCourse] = useState<{ id: string; name: string } | undefined>()
  const [selectedFile, setSelectedFile] = useState<{ id: string; title: string } | undefined>()

  const handleCourseSelect = (id: string, name: string) => {
    setSelectedCourse({ id, name })
    setSelectedFile(undefined)
  }

  const handleBack = () => {
    setSelectedCourse(undefined)
    setSelectedFile(undefined)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {!selectedCourse ? (
          <CourseStep onSelect={handleCourseSelect} />
        ) : (
          <FileStep
            courseId={selectedCourse.id}
            courseName={selectedCourse.name}
            selectedFile={selectedFile}
            onFileSelect={(id, title) => setSelectedFile({ id, title })}
            onBack={handleBack}
          />
        )}
      </div>
    </main>
  )
}
