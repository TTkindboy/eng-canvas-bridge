import { useState } from "react"
import useSWR from "swr"
import { ArrowLeft, CalendarPlus, CheckCircle2 } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { fetchSchedulePreview, addToPlannerNotes } from "@/lib/api"
import type { PlannerNote, Eng10Schedule } from "@/lib/client"
import { cn } from "@/lib/utils"

interface SchedulePreviewStepProps {
  fileId: string
  fileTitle: string
  courseId: string
  courseName: string
  onBack: () => void
}

function DateChip({ dateStr }: { dateStr: string }) {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  const month = date.toLocaleDateString(undefined, { month: "short" })
  const day = date.getDate()
  return (
    <div className="flex shrink-0 flex-col items-center justify-center rounded-lg border border-foreground/15 bg-foreground/5 w-10 py-1.5 gap-0">
      <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground leading-none">
        {month}
      </span>
      <span className="text-base font-bold text-foreground tabular-nums leading-tight">
        {day}
      </span>
    </div>
  )
}

function NoteRow({ note, index }: { note: PlannerNote; index: number }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {note.todo_date ? (
        <DateChip dateStr={note.todo_date} />
      ) : (
        <div className="shrink-0 w-10 h-10 rounded-lg border border-border bg-muted" />
      )}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="text-sm font-medium text-card-foreground leading-snug">
          {note.title}
        </span>
        {note.description && (
          <span className="text-xs text-muted-foreground line-clamp-1">
            {note.description}
          </span>
        )}
      </div>
    </div>
  )
}

function NoteList({ notes }: { notes: PlannerNote[] }) {
  if (notes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">No entries found.</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-1.5">
      {notes.map((note, i) => (
        <NoteRow key={note.id ?? i} note={note} index={i} />
      ))}
    </div>
  )
}

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-1.5">
      {[80, 65, 72, 88].map((w, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-muted animate-pulse" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-3 rounded-full bg-muted animate-pulse" style={{ width: `${w}%` }} />
            <div className="h-2.5 rounded-full bg-muted/60 animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SegmentedTabs({
  value,
  onChange,
  oddCount,
  evenCount,
}: {
  value: "odd" | "even"
  onChange: (v: "odd" | "even") => void
  oddCount: number
  evenCount: number
}) {
  return (
    <div className="flex rounded-xl border border-border overflow-hidden">
      {(["odd", "even"] as const).map((tab) => {
        const active = value === tab
        const count = tab === "odd" ? oddCount : evenCount
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 py-2 text-sm font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
              tab === "even" && "border-l border-border",
            )}
          >
            <span className="capitalize">{tab} days</span>
            <span
              className={cn(
                "flex items-center justify-center rounded-full w-4 h-4 text-[10px] font-bold tabular-nums transition-colors",
                active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function SchedulePreviewStep({
  fileId,
  fileTitle,
  courseId,
  onBack,
}: SchedulePreviewStepProps) {
  const [activeTab, setActiveTab] = useState<"odd" | "even">("odd")
  const [adding, setAdding] = useState<"odd" | "even" | null>(null)
  const [added, setAdded] = useState<Set<"odd" | "even">>(new Set())
  const [addError, setAddError] = useState<string | null>(null)

  const { data: schedule, error, isLoading } = useSWR<Eng10Schedule>(
    ["schedule-preview", fileId],
    ([, id]: [string, string]) => fetchSchedulePreview(id),
  )

  const handleAdd = async (day: "odd" | "even") => {
    setAdding(day)
    setAddError(null)
    try {
      await addToPlannerNotes(fileId, day, Number(courseId))
      setAdded((prev) => new Set([...prev, day]))
    } catch {
      setAddError(`Failed to add ${day} days to planner.`)
    } finally {
      setAdding(null)
    }
  }

  const activeNotes: PlannerNote[] = schedule ? schedule[activeTab] : []
  const isDone = added.has(activeTab)
  const isAddingActive = adding === activeTab
  const isDisabled = isAddingActive || isDone || adding !== null

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium tracking-wide uppercase">
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            3
          </span>
          Step 3 of 3
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          Preview schedule
        </h1>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit mt-0.5"
        >
          <ArrowLeft className="size-3.5" />
          <span className="truncate max-w-[220px]">{fileTitle}</span>
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-muted-foreground text-sm">
            <Spinner className="size-4" />
            Parsing schedule...
          </div>
          <SkeletonRows />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-destructive text-sm">Failed to load schedule preview.</p>
      )}

      {/* Content */}
      {schedule && (
        <div className="flex flex-col gap-3">
          <SegmentedTabs
            value={activeTab}
            onChange={setActiveTab}
            oddCount={schedule.odd.length}
            evenCount={schedule.even.length}
          />

          <NoteList notes={activeNotes} />

          <Button
            onClick={() => handleAdd(activeTab)}
            disabled={isDisabled}
            variant={isDone ? "outline" : "default"}
            className={cn(
              "w-full gap-2 transition-all",
              isDone && "border-foreground/20 text-muted-foreground",
            )}
          >
            {isAddingActive ? (
              <>
                <Spinner className="size-4" />
                Adding...
              </>
            ) : isDone ? (
              <>
                <CheckCircle2 className="size-4" />
                Added to planner
              </>
            ) : (
              <>
                <CalendarPlus className="size-4" />
                Add {activeTab} days to Canvas
              </>
            )}
          </Button>

          {addError && (
            <p className="text-destructive text-sm">{addError}</p>
          )}
        </div>
      )}
    </div>
  )
}
