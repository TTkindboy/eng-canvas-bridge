import useSWR from "swr"
import { ArrowLeft, FileText, ChevronRight, SendHorizonal } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { fetchCourseFiles, type FileOption } from "@/lib/api"
import { isSchedule } from "@/lib/highlighting"
import { cn } from "@/lib/utils"

interface FileStepProps {
  courseId: string
  courseName: string
  selectedFile: { id: string; title: string } | undefined
  onFileSelect: (id: string, title: string) => void
  onBack: () => void
}

export function FileStep({ courseId, courseName, selectedFile, onFileSelect, onBack }: FileStepProps) {
  const pdfsKey = courseId ? (["course-pdfs", courseId] as const) : null

  const { data: pdfs, error, isLoading } = useSWR<FileOption[]>(
    pdfsKey,
    ([, currentCourseId]: readonly [string, string]) => fetchCourseFiles(currentCourseId)
  )

  const sortedPdfs = pdfs?.toSorted(
    (a, b) => Number(isSchedule(b.title)) - Number(isSchedule(a.title)) // preserves backend sorting
  )

  const handleSubmit = () => {
    if (selectedFile) {
      console.log("Selected file ID:", selectedFile.id)
      alert(`File ID sent: ${selectedFile.id}`)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium tracking-wide uppercase">
          <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold">2</span>
          Step 2 of 2
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
        {sortedPdfs?.map((pdf) => {
          const isSelected = selectedFile?.id === pdf.id
          const hasMonth = isSchedule(pdf.title)

          return (
            <button
              key={pdf.id}
              onClick={() => onFileSelect(pdf.id, pdf.title)}
              className={cn(
                "group flex items-center justify-between rounded-xl border px-4 py-3",
                "text-left text-sm transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected
                  ? "border-foreground bg-foreground text-background"
                  : hasMonth
                    ? "border-foreground/40 bg-foreground/5 font-bold hover:bg-foreground/10 hover:border-foreground/60 hover:shadow-md"
                    : "border-border bg-card font-medium text-card-foreground hover:border-foreground/30 hover:bg-accent hover:shadow-sm"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className={cn(
                  "size-4 shrink-0 transition-colors",
                  isSelected
                    ? "text-background/70"
                    : hasMonth
                      ? "text-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span className="truncate">{pdf.title}</span>
              </div>
              <ChevronRight className={cn(
                "size-4 shrink-0 transition-colors",
                isSelected
                  ? "text-background/50"
                  : hasMonth
                    ? "text-foreground/70"
                    : "text-muted-foreground/50 group-hover:text-foreground"
              )} />
            </button>
          )
        })}
      </div>

      {selectedFile && (
        <Button onClick={handleSubmit} className="w-full gap-2">
          <SendHorizonal className="size-4" />
          Send file ID
        </Button>
      )}
    </div>
  )
}
