import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "TODO" | "IN_PROGRESS" | "DONE" | "HIGH" | "MEDIUM" | "LOW" | "ADMIN" | "MEMBER";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  
  const variants = {
    default: "bg-muted text-muted-foreground",
    TODO: "bg-todo-bg text-todo-fg",
    IN_PROGRESS: "bg-in-progress-bg text-in-progress-fg",
    DONE: "bg-done-bg text-done-fg",
    HIGH: "bg-high-bg text-high-fg",
    MEDIUM: "bg-in-progress-bg text-in-progress-fg",
    LOW: "bg-low-bg text-low-fg",
    ADMIN: "bg-admin-bg text-admin-fg",
    MEMBER: "bg-member-bg text-member-fg",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-[99px] px-2.5 py-0.5 text-[11px] font-medium transition-colors border-[0.5px] border-transparent",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
