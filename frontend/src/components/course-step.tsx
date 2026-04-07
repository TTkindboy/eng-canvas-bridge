import useSWR from "swr"
import { GraduationCap } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { SelectableItem } from "@/components/selectable-item"
import { fetchCourses, type CourseOption } from "@/lib/api"
import { isEnglishCourse } from "@/lib/highlighting"

interface CourseStepProps {
  onSelect: (id: string, name: string) => void
}

export function CourseStep({ onSelect }: CourseStepProps) {
  const { data: courses, error, isLoading } = useSWR<CourseOption[]>("courses", fetchCourses)

  const sortedCourses = courses?.toSorted( // MAYBE: add alphabetical tiebreaker bc courses don't have backend sorting logic
    (a, b) => Number(isEnglishCourse(b.name)) - Number(isEnglishCourse(a.name))
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium tracking-wide uppercase">
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
          Step 1 of 3
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          Select a course
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose the course you want to work with.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        {isLoading && (
          <div className="flex items-center gap-3 py-6 text-muted-foreground text-sm">
            <Spinner className="size-4" />
            Loading courses...
          </div>
        )}
        {error && (
          <p className="text-destructive text-sm">Failed to load courses.</p>
        )}
        {sortedCourses?.map((course) => (
          <SelectableItem
            key={course.id}
            icon={GraduationCap}
            label={course.name}
            highlighted={isEnglishCourse(course.name)}
            onClick={() => onSelect(course.id, course.name)}
          />
        ))}
      </div>
    </div>
  )
}
