import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useGetContractions, useCreateContraction, useClearContractions, useDeleteContraction } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Timer, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatSeconds(s: number | null | undefined): string {
  if (s == null) return "--";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function Contractions() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: contractions = [], refetch } = useGetContractions();
  const createMutation = useCreateContraction();
  const clearMutation = useClearContractions();
  const deleteOneMutation = useDeleteContraction();

  const [active, setActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active && startTime) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active, startTime]);

  function handleStart() {
    const now = new Date();
    setStartTime(now);
    setElapsed(0);
    setActive(true);
  }

  function handleStop() {
    if (!startTime) return;
    setActive(false);
    const endTime = new Date();
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Calculate interval from the last completed contraction
    const lastCompleted = contractions.find((c) => c.endTime != null);
    let intervalSeconds: number | null = null;
    if (lastCompleted?.endTime) {
      intervalSeconds = Math.floor((startTime.getTime() - new Date(lastCompleted.endTime).getTime()) / 1000);
    }

    createMutation.mutate(
      { data: { startTime: startTime.toISOString(), endTime: endTime.toISOString(), durationSeconds, intervalSeconds } },
      { onSuccess: () => { refetch(); setStartTime(null); } }
    );
  }

  function handleClear() {
    clearMutation.mutate(undefined, {
      onSuccess: () => {
        refetch();
        toast({ title: t("contractions.cleared") });
      },
    });
  }

  function handleDelete(id: number) {
    deleteOneMutation.mutate({ id }, { onSuccess: () => refetch() });
  }

  // Last 3 averages
  const recent = contractions.slice(0, 5).filter((c) => c.durationSeconds != null);
  const avgDuration = recent.length
    ? Math.round(recent.reduce((s, c) => s + (c.durationSeconds ?? 0), 0) / recent.length)
    : null;
  const recentIntervals = contractions.slice(0, 5).filter((c) => c.intervalSeconds != null);
  const avgInterval = recentIntervals.length
    ? Math.round(recentIntervals.reduce((s, c) => s + (c.intervalSeconds ?? 0), 0) / recentIntervals.length)
    : null;

  const warningColor =
    avgInterval != null && avgInterval < 300
      ? "text-destructive"
      : avgInterval != null && avgInterval < 600
      ? "text-amber-500"
      : "text-muted-foreground";

  return (
    <div className="p-6 space-y-8 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">{t("contractions.title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("contractions.subtitle")}</p>
      </div>

      {/* Main timer */}
      <div className="flex flex-col items-center gap-6 py-8 rounded-2xl border bg-card">
        <div className="text-6xl font-mono font-bold tabular-nums text-foreground tracking-tight">
          {formatSeconds(active ? elapsed : null) === "--" ? "0s" : formatSeconds(active ? elapsed : null)}
        </div>

        {active ? (
          <Button
            size="lg"
            variant="destructive"
            className="w-40 h-14 text-lg rounded-full"
            onClick={handleStop}
          >
            {t("contractions.stop")}
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-40 h-14 text-lg rounded-full bg-primary"
            onClick={handleStart}
          >
            <Timer className="w-5 h-5 mr-2" />
            {t("contractions.start")}
          </Button>
        )}

        {active && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {t("contractions.timing")} {formatTime(startTime!.toISOString())}
          </p>
        )}
      </div>

      {/* Stats */}
      {contractions.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{formatSeconds(avgDuration)}</div>
            <div className="text-xs text-muted-foreground mt-1">{t("contractions.avgDuration")}</div>
          </div>
          <div className={`rounded-xl border bg-card p-4 text-center`}>
            <div className={`text-2xl font-bold ${warningColor}`}>{formatSeconds(avgInterval)}</div>
            <div className="text-xs text-muted-foreground mt-1">{t("contractions.avgInterval")}</div>
            {avgInterval != null && avgInterval < 300 && (
              <div className="flex items-center justify-center gap-1 mt-1 text-destructive text-xs font-medium">
                <AlertCircle className="w-3 h-3" /> {t("contractions.callDoctor")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {contractions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">{t("contractions.history")}</h2>
            <button
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> {t("contractions.clearAll")}
            </button>
          </div>
          <div className="space-y-2">
            {contractions.slice(0, 20).map((c, i) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {formatTime(c.startTime)} → {c.endTime ? formatTime(c.endTime) : "..."}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("contractions.duration")}: {formatSeconds(c.durationSeconds)}
                      {c.intervalSeconds != null && (
                        <> · {t("contractions.interval")}: {formatSeconds(c.intervalSeconds)}</>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-muted-foreground hover:text-destructive p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {contractions.length === 0 && !active && (
        <div className="text-center py-12 text-muted-foreground">
          <Timer className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{t("contractions.empty")}</p>
        </div>
      )}
    </div>
  );
}
