import useSWR from "swr"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { fetchCourseFiles, type FileOption } from "@/lib/api"

interface FileSelectorProps {
  courseId: string | undefined
  value: string | undefined
  onValueChange: (value: string) => void
}

export function FileSelector({ courseId, value, onValueChange }: FileSelectorProps) {
  const pdfsKey = courseId ? (["course-pdfs", courseId] as const) : null

  const { data: pdfs, error, isLoading } = useSWR<FileOption[]>(
    pdfsKey,
    ([, currentCourseId]: readonly [string, string]) => fetchCourseFiles(currentCourseId)
  )

  if (!courseId) {
    return (
      <Select disabled>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a course first" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="placeholder">Select a course first</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  if (error) {
    return (
      <div className="text-destructive text-sm">
        Failed to load files
      </div>
    )
  }

  const hasFiles = pdfs && pdfs.length > 0

  return (
    <Select value={value} onValueChange={onValueChange} disabled={isLoading || !hasFiles}>
      <SelectTrigger className="w-full">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Spinner className="size-4" />
            <span>Loading files...</span>
          </div>
        ) : (
          <SelectValue placeholder={hasFiles ? "Select a file" : "No files available"} />
        )}
      </SelectTrigger>
      <SelectContent>
        {pdfs?.map((pdf) => (
          <SelectItem key={pdf.id} value={pdf.id}>
            {pdf.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
