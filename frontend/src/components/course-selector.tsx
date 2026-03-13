import useSWR from "swr"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { fetchCourses, type CourseOption } from "@/lib/api"

interface CourseSelectorProps {
  value: string | undefined
  onValueChange: (value: string) => void
}

export function CourseSelector({ value, onValueChange }: CourseSelectorProps) {
  const { data: courses, error, isLoading } = useSWR<CourseOption[]>("courses", fetchCourses)

  if (error) {
    return (
      <div className="text-destructive text-sm">
        Failed to load courses
      </div>
    )
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
      <SelectTrigger className="w-full">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Spinner className="size-4" />
            <span>Loading courses...</span>
          </div>
        ) : (
          <SelectValue placeholder="Select a course" />
        )}
      </SelectTrigger>
      <SelectContent>
        {courses?.map((course) => (
          <SelectItem key={course.id} value={course.id}>
            {course.courseCode ? `${course.courseCode} - ${course.name}` : course.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
