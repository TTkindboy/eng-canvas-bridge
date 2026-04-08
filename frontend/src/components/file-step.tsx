import useSWR from "swr"
import { ArrowLeft, Calendar, Upload } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import Magnet from "@/components/ui/magnet"
import { SelectableItem } from "@/components/selectable-item"
import { fetchCourseFiles, type FileOption } from "@/lib/api"
import { isSchedule } from "@/lib/highlighting"
import { useCallback } from "react"
import { useDropzone } from "react-dropzone"

interface FileStepProps {
  courseId: string
  courseName: string
  onFileSelect: (id: string, title: string) => void
  onBack: () => void
}

export function FileStep({ courseId, courseName, onFileSelect, onBack }: FileStepProps) {
  const pdfsKey = courseId ? (["course-pdfs", courseId] as const) : null

  const { data: pdfs, error, isLoading } = useSWR<FileOption[]>(
    pdfsKey,
    ([, currentCourseId]: readonly [string, string]) => fetchCourseFiles(currentCourseId)
  )

  const visiblePdfs = pdfs?.filter(f => isSchedule(f.title))

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    console.log("Dropped file:", file)
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragGlobal } = useDropzone({
    onDrop,
    noClick: true,
    accept: { "application/pdf": [".pdf"] }, // add docx later with 11th grade support
  })

  const showDropOverlay = isDragGlobal || isDragActive

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium tracking-wide uppercase">
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
          Step 2 of 3
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          Select or drop a schedule
        </h1>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit mt-0.5"
        >
          <ArrowLeft className="size-3.5" />
          <span className="truncate max-w-[200px]">{courseName}</span>
        </button>
      </div>

      <div {...getRootProps()} className="relative flex min-h-64 flex-col gap-1">
        <input {...getInputProps()} />
        <div
          className={`flex flex-col gap-1 transition-opacity duration-200 ${
            showDropOverlay ? "opacity-25" : "opacity-100"
          }`}
        >
          {isLoading && (
            <div className="flex items-center gap-3 py-6 text-muted-foreground text-sm">
              <Spinner className="size-4" />
              Loading files...
            </div>
          )}
          {error && (
            <p className="text-destructive text-sm">Failed to load files.</p>
          )}
          {!isLoading && visiblePdfs?.length === 0 && (
            <p className="text-muted-foreground text-sm py-4">No schedules found for this course.</p>
          )}
          {visiblePdfs?.map((pdf, index) => (
            <SelectableItem
              key={pdf.id}
              icon={Calendar}
              label={pdf.title}
              highlighted={index === 0}
              onClick={() => onFileSelect(pdf.id, pdf.title)}
            />
          ))}
        </div>
        {showDropOverlay && (
          <Magnet
            wrapperClassName="absolute inset-0 z-10"
            wrapperStyle={{ position: "absolute", display: "block" }}
            innerStyle={{ width: "100%", height: "100%" }}
            magnetStrength={5}
          >
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary bg-primary/10">
              <Upload className="size-5 text-primary" />
              <span className="text-sm font-medium text-primary">Drop PDF here</span>
            </div>
          </Magnet>
        )}
      </div>
    </div>
  )
}
