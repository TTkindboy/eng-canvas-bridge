import useSWR from "swr"
import { ArrowLeft, FileText, Calendar } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { SelectableItem } from "@/components/selectable-item"
import { fetchCourseFiles, type FileOption } from "@/lib/api"
import { isSchedule } from "@/lib/highlighting"

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

  const sortedPdfs = pdfs?.toSorted(
    (a, b) => Number(isSchedule(b.title)) - Number(isSchedule(a.title))
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium tracking-wide uppercase">
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
          Step 2 of 3
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          Select a file
        </h1>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit mt-0.5"
        >
          <ArrowLeft className="size-3.5" />
          <span className="truncate max-w-[200px]">{courseName}</span>
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {isLoading && (
          <div className="flex items-center gap-3 py-6 text-muted-foreground text-sm">
            <Spinner className="size-4" />
            Loading files...
          </div>
        )}
        {error && (
          <p className="text-destructive text-sm">Failed to load files.</p>
        )}
        {!isLoading && sortedPdfs?.length === 0 && (
          <p className="text-muted-foreground text-sm py-4">No files found for this course.</p>
        )}
        {sortedPdfs?.map((pdf) => (
          <SelectableItem
            key={pdf.id}
            icon={isSchedule(pdf.title) ? Calendar : FileText}
            label={pdf.title}
            highlighted={isSchedule(pdf.title)}
            onClick={() => onFileSelect(pdf.id, pdf.title)}
          />
        ))}
      </div>
    </div>
  )
}
