import React from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { 
  useGetDashboardSummary, 
  useGetBabies, 
  useGetSettings 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Calendar as CalendarIcon, CheckSquare, Baby as BabyIcon, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: babies, isLoading: isLoadingBabies } = useGetBabies();
  const { data: settings, isLoading: isLoadingSettings } = useGetSettings();

  if (isLoadingSummary || isLoadingBabies || isLoadingSettings) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  const hasBabies = babies && babies.length > 0;
  const checklistProgressPercent = summary?.checklistProgress.total 
    ? Math.round((summary.checklistProgress.completed / summary.checklistProgress.total) * 100) 
    : 0;

  return (
    <div className="p-6 md:p-8 animate-in fade-in duration-500 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif font-bold mb-2">
            {t("dashboard.welcome", { name: settings?.parentName || t("dashboard.dad") })}
          </h1>
          <p className="text-muted-foreground text-lg">
            {hasBabies ? t("dashboard.taglineAfter") : t("dashboard.taglineBefore")}
          </p>
        </div>
        {!hasBabies && summary?.daysUntilDue !== undefined && summary?.daysUntilDue !== null && (
          <div className="text-right">
            <div className="text-5xl font-serif font-bold text-primary">
              {summary.daysUntilDue}
            </div>
            <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">
              {t("dashboard.daysToGo")}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!hasBabies && (
          <>
            <Card className="border-border/50 shadow-sm col-span-1 md:col-span-2 bg-primary/5 border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-primary" />
                    {t("dashboard.preparationProgress")}
                  </CardTitle>
                  <span className="text-primary font-medium">{checklistProgressPercent}%</span>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={checklistProgressPercent} className="h-3 bg-primary/10" />
                <div className="mt-4 flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {t("dashboard.tasksCompleted", {
                      completed: summary?.checklistProgress.completed,
                      total: summary?.checklistProgress.total,
                    })}
                  </span>
                  <Link href="/prepare" className="text-primary font-medium hover:underline">
                    {t("dashboard.viewChecklist")}
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {hasBabies && babies.map(baby => (
          <Card key={baby.id} className="border-border/50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: baby.colorHex }} />
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: baby.colorHex }}>
                <BabyIcon className="w-5 h-5" />
                {baby.name}
              </CardTitle>
              <CardDescription>{t("dashboard.todayActivity")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {summary?.totalFeedingsToday ? Math.floor(summary.totalFeedingsToday / 2) : 0}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("dashboard.feedings")}</div>
                  </div>
                  <div className="bg-muted rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {summary?.totalDiapersToday ? Math.floor(summary.totalDiapersToday / 2) : 0}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{t("dashboard.diapers")}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/babies?babyId=${baby.id}`} className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary font-medium text-center py-2 rounded-lg transition-colors text-sm">
                    {t("dashboard.logActivity")}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-secondary" />
              {t("dashboard.upcomingAppointments")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.upcomingAppointments && summary.upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {summary.upcomingAppointments.slice(0, 3).map(apt => (
                  <div key={apt.id} className="flex gap-4">
                    <div className="flex flex-col items-center justify-center bg-secondary/10 text-secondary rounded-lg w-12 h-12 shrink-0">
                      <span className="text-xs font-bold uppercase">{format(new Date(apt.appointmentDate), "MMM")}</span>
                      <span className="text-lg font-bold leading-none">{format(new Date(apt.appointmentDate), "d")}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{apt.title}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {format(new Date(apt.appointmentDate), "h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>{t("dashboard.noAppointments")}</p>
              </div>
            )}
            <div className="mt-6 text-center">
              <Link href="/prepare" className="text-sm text-secondary font-medium hover:underline">
                {t("dashboard.manageSchedule")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
