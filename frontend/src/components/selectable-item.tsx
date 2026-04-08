import { ChevronRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectableItemProps {
  icon: LucideIcon
  label: string
  highlighted: boolean
  onClick: () => void
}

export function SelectableItem({ icon: Icon, label, highlighted, onClick }: SelectableItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex items-center justify-between rounded-xl border px-4 py-3",
        "text-left text-sm transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        highlighted
          ? "border-primary/35 bg-primary/5 font-bold hover:bg-primary/10 hover:border-primary/55 hover:shadow-md"
          : "border-border bg-card font-medium text-card-foreground hover:border-primary/25 hover:bg-accent hover:shadow-sm"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon
          className={cn(
            "size-4 shrink-0 transition-colors",
            highlighted ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          )}
        />
        <span className="truncate">{label}</span>
      </div>
      <ChevronRight
        className={cn(
          "size-4 shrink-0 transition-colors",
          highlighted ? "text-primary/70" : "text-muted-foreground/50 group-hover:text-foreground"
        )}
      />
    </button>
  )
}
