import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AdminSurface({ children, className, contentClassName, style }) {
  return (
    <Card
      className={cn(
        "border-border/80 bg-card shadow-sm ring-1 ring-foreground/5 transition-shadow hover:shadow-md",
        className,
      )}
      style={style}
    >
      <CardContent className={cn("gap-0 p-5 pt-5", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
