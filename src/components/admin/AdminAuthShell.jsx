import { Link } from "react-router-dom";
import { AdminProviders } from "./AdminProviders";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AdminAuthShell({ title, subtitle, footer, children }) {
  return (
    <AdminProviders>
      <div
        className="theme flex min-h-screen items-center justify-center px-4 py-10"
        data-admin-shell
        style={{
          background:
            "radial-gradient(ellipse 95% 55% at 0% 0%, rgba(0,168,107,0.18), transparent 45%), radial-gradient(ellipse 80% 45% at 100% 100%, rgba(0,143,90,0.12), transparent 55%), linear-gradient(170deg, #f8faf9 0%, #f0f3f2 45%, #ebece9 100%)",
        }}
      >
        <div className="mx-auto w-full max-w-[460px]">
          <Card className="border-border/70 shadow-[0_18px_40px_rgba(28,25,23,0.08)] ring-1 ring-black/5">
            <CardHeader className="space-y-1 border-b border-border/60 bg-muted/40 pb-4">
              <CardTitle className="text-center text-lg font-semibold tracking-tight">{title}</CardTitle>
              {subtitle ? <CardDescription className="text-center text-sm">{subtitle}</CardDescription> : null}
            </CardHeader>
            <CardContent className="pt-6">{children}</CardContent>
            {footer ? (
              <CardFooter className="justify-center border-t border-border/60 bg-muted/20 py-4">
                <Link
                  to={footer.to}
                  className="text-sm font-medium text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
                >
                  {footer.label}
                </Link>
              </CardFooter>
            ) : null}
          </Card>
        </div>
      </div>
    </AdminProviders>
  );
}
