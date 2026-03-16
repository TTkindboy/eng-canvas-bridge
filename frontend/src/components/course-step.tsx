import useSWR from "swr"
import { ChevronRight, GraduationCap } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { fetchCourses, type CourseOption } from "@/lib/api"
import { isEnglishCourse } from "@/lib/highlighting"
import { cn } from "@/lib/utils"

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
          <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold">1</span>
          Step 1 of 2
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
        {sortedCourses?.map((course) => {
          const isEnglish = isEnglishCourse(course.name)
          return (
            <button
              key={course.id}
              onClick={() => onSelect(course.id, course.name)}
              className={cn(
                "group flex items-center justify-between rounded-xl border px-4 py-3",
                "text-left text-sm transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isEnglish
                  ? "border-foreground/40 bg-foreground/5 font-bold hover:bg-foreground/10 hover:border-foreground/60 hover:shadow-md"
                  : "border-border bg-card font-medium text-card-foreground hover:border-foreground/30 hover:bg-accent hover:shadow-sm"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <GraduationCap className={cn(
                  "size-4 shrink-0 transition-colors",
                  isEnglish ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span className="truncate">{course.name}</span>
              </div>
              <ChevronRight className={cn(
                "size-4 shrink-0 transition-colors",
                isEnglish ? "text-foreground/70" : "text-muted-foreground/50 group-hover:text-foreground"
              )} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
