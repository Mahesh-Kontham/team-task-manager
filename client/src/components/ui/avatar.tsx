import * as React from "react"
import { cn } from "../../lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name, ...props }, ref) => {
    const initials = name ? name.substring(0, 2).toUpperCase() : "?";
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/10 items-center justify-center border-[0.5px] border-border text-primary text-[11px] font-medium",
          className
        )}
        title={name}
        {...props}
      >
        {initials}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar }
