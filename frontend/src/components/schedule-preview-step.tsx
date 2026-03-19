import { useState } from "react"
import useSWR from "swr"
import { ArrowLeft, CalendarPlus, CheckCircle2 } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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

function NoteList({ notes }: { notes: PlannerNote[] }) {
  if (notes.length === 0) {
    return <p className="text-muted-foreground text-sm py-4">No entries found.</p>
  }
  return (
    <div className="flex flex-col gap-1">
      {notes.map((note, i) => (
        <div
          key={note.id ?? i}
          className="flex items-start justify-between rounded-lg border border-border bg-card px-3 py-2.5 gap-3"
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-medium text-card-foreground truncate">{note.title}</span>
            {note.description && (
              <span className="text-xs text-muted-foreground line-clamp-2">{note.description}</span>
            )}
          </div>
          {note.todo_date && (
            <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
              {new Date(note.todo_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export function SchedulePreviewStep({
  fileId,
  fileTitle,
  courseId,
  courseName,
  onBack,
}: SchedulePreviewStepProps) {
  const [adding, setAdding] = useState<'odd' | 'even' | null>(null)
  const [added, setAdded] = useState<Set<'odd' | 'even'>>(new Set())
  const [addError, setAddError] = useState<string | null>(null)

  const { data: schedule, error, isLoading } = useSWR<Eng10Schedule>(
    ["schedule-preview", fileId],
    ([, id]: [string, string]) => fetchSchedulePreview(id)
  )

  const handleAdd = async (day: 'odd' | 'even') => {
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium tracking-wide uppercase">
          <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold">3</span>
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

      {isLoading && (
        <div className="flex items-center gap-3 py-6 text-muted-foreground text-sm">
          <Spinner className="size-4" />
          Parsing schedule...
        </div>
      )}

      {error && (
        <p className="text-destructive text-sm">Failed to load schedule preview.</p>
      )}

      {schedule && (
        <Tabs defaultValue="odd" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="odd" className="flex-1">
              Odd days
              <span className="ml-1.5 text-xs opacity-60">({schedule.odd.length})</span>
            </TabsTrigger>
            <TabsTrigger value="even" className="flex-1">
              Even days
              <span className="ml-1.5 text-xs opacity-60">({schedule.even.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="odd" className="mt-3 flex flex-col gap-3">
            <NoteList notes={schedule.odd} />
            <AddButton
              day="odd"
              adding={adding}
              added={added}
              onAdd={handleAdd}
            />
          </TabsContent>

          <TabsContent value="even" className="mt-3 flex flex-col gap-3">
            <NoteList notes={schedule.even} />
            <AddButton
              day="even"
              adding={adding}
              added={added}
              onAdd={handleAdd}
            />
          </TabsContent>
        </Tabs>
      )}

      {addError && (
        <p className="text-destructive text-sm">{addError}</p>
      )}
    </div>
  )
}

function AddButton({
  day,
  adding,
  added,
  onAdd,
}: {
  day: 'odd' | 'even'
  adding: 'odd' | 'even' | null
  added: Set<'odd' | 'even'>
  onAdd: (day: 'odd' | 'even') => void
}) {
  const isDone = added.has(day)
  const isLoading = adding === day
  const isDisabled = isLoading || isDone || adding !== null

  return (
    <Button
      onClick={() => onAdd(day)}
      disabled={isDisabled}
      variant={isDone ? "outline" : "default"}
      className={cn("w-full gap-2", isDone && "text-muted-foreground")}
    >
      {isLoading ? (
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
          Add {day} days to planner
        </>
      )}
    </Button>
  )
}
