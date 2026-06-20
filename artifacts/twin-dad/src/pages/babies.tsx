import React, { useState, useEffect, useRef } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import {
  useGetBabies,
  useGetFeedingLogs,
  useGetDiaperLogs,
  useGetSleepLogs,
  useGetBabyToday,
  useCreateFeedingLog,
  useCreateDiaperLog,
  useCreateSleepLog,
  useDeleteFeedingLog,
  useDeleteDiaperLog,
  useDeleteSleepLog,
  getGetFeedingLogsQueryKey,
  getGetDiaperLogsQueryKey,
  getGetSleepLogsQueryKey,
  getGetBabyTodayQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Baby as BabyIcon,
  Droplets,
  Moon,
  Trash2,
  UtensilsCrossed,
  Settings,
  Timer,
} from "lucide-react";

type FeedType = "breast" | "bottle" | "formula";
type DiaperType = "wet" | "dirty" | "both";

interface SleepState {
  logId: number;
  startTime: string;
}

function useSleepTimer(babyId: number) {
  const key = `twin-dad-sleep-${babyId}`;
  const [active, setActive] = useState<SleepState | null>(() => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  });

  function store(s: SleepState | null) {
    if (s) localStorage.setItem(key, JSON.stringify(s));
    else localStorage.removeItem(key);
    setActive(s);
  }

  return { active, store };
}

function ElapsedTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState("");
  useEffect(() => {
    function tick() {
      const diff = Date.now() - new Date(startTime).getTime();
      const mins = Math.floor(diff / 60000);
      const hrs = Math.floor(mins / 60);
      const m = mins % 60;
      setElapsed(hrs > 0 ? `${hrs}h ${m}m` : `${m}m`);
    }
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [startTime]);
  return <>{elapsed}</>;
}

function BabyPanel({ baby }: { baby: { id: number; name: string; colorHex: string } }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { active: sleepActive, store: storeSleep } = useSleepTimer(baby.id);

  const [feedingOpen, setFeedingOpen] = useState(false);
  const [diaperOpen, setDiaperOpen] = useState(false);

  const [feedType, setFeedType] = useState<FeedType>("breast");
  const [feedAmount, setFeedAmount] = useState("");
  const [feedDuration, setFeedDuration] = useState("");
  const [feedNotes, setFeedNotes] = useState("");

  const [diaperType, setDiaperType] = useState<DiaperType>("wet");
  const [diaperNotes, setDiaperNotes] = useState("");

  const { data: todaySummary } = useGetBabyToday(baby.id, {
    query: { queryKey: getGetBabyTodayQueryKey(baby.id) },
  });

  const { data: feedingLogs, isLoading: loadingFeeds } = useGetFeedingLogs(
    { babyId: baby.id, limit: 20 },
    { query: { queryKey: getGetFeedingLogsQueryKey({ babyId: baby.id, limit: 20 }) } }
  );
  const { data: diaperLogs, isLoading: loadingDiapers } = useGetDiaperLogs(
    { babyId: baby.id, limit: 20 },
    { query: { queryKey: getGetDiaperLogsQueryKey({ babyId: baby.id, limit: 20 }) } }
  );
  const { data: sleepLogs, isLoading: loadingSleep } = useGetSleepLogs(
    { babyId: baby.id, limit: 20 },
    { query: { queryKey: getGetSleepLogsQueryKey({ babyId: baby.id, limit: 20 }) } }
  );

  const createFeeding = useCreateFeedingLog();
  const createDiaper = useCreateDiaperLog();
  const createSleep = useCreateSleepLog();
  const deleteFeeding = useDeleteFeedingLog();
  const deleteDiaper = useDeleteDiaperLog();
  const deleteSleep = useDeleteSleepLog();

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: getGetFeedingLogsQueryKey({ babyId: baby.id, limit: 20 }) });
    queryClient.invalidateQueries({ queryKey: getGetDiaperLogsQueryKey({ babyId: baby.id, limit: 20 }) });
    queryClient.invalidateQueries({ queryKey: getGetSleepLogsQueryKey({ babyId: baby.id, limit: 20 }) });
    queryClient.invalidateQueries({ queryKey: getGetBabyTodayQueryKey(baby.id) });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  }

  function submitFeeding() {
    createFeeding.mutate(
      {
        data: {
          babyId: baby.id,
          feedType,
          amount: feedAmount ? parseFloat(feedAmount) : null,
          durationMinutes: feedDuration ? parseInt(feedDuration) : null,
          notes: feedNotes || null,
          loggedAt: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          setFeedingOpen(false);
          setFeedAmount("");
          setFeedDuration("");
          setFeedNotes("");
          invalidateAll();
          toast({ title: t("babies.feedingLogged") });
        },
      }
    );
  }

  function submitDiaper() {
    createDiaper.mutate(
      {
        data: {
          babyId: baby.id,
          diaperType,
          notes: diaperNotes || null,
          loggedAt: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          setDiaperOpen(false);
          setDiaperNotes("");
          invalidateAll();
          toast({ title: t("babies.diaperLogged") });
        },
      }
    );
  }

  function handleStartSleep() {
    const startTime = new Date().toISOString();
    createSleep.mutate(
      { data: { babyId: baby.id, startTime, endTime: null } },
      {
        onSuccess: (data) => {
          storeSleep({ logId: data.id, startTime });
          invalidateAll();
          toast({ title: t("babies.sleepStarted") });
        },
      }
    );
  }

  function handleStopSleep() {
    if (!sleepActive) return;
    const endTime = new Date().toISOString();
    deleteSleep.mutate(
      { id: sleepActive.logId },
      {
        onSuccess: () => {
          createSleep.mutate(
            { data: { babyId: baby.id, startTime: sleepActive.startTime, endTime } },
            {
              onSuccess: () => {
                storeSleep(null);
                invalidateAll();
                toast({ title: t("babies.sleepStopped") });
              },
            }
          );
        },
      }
    );
  }

  function handleDeleteFeeding(id: number) {
    if (!confirm(t("babies.deleteConfirm"))) return;
    deleteFeeding.mutate({ id }, { onSuccess: () => { invalidateAll(); toast({ title: t("babies.entryDeleted") }); } });
  }

  function handleDeleteDiaper(id: number) {
    if (!confirm(t("babies.deleteConfirm"))) return;
    deleteDiaper.mutate({ id }, { onSuccess: () => { invalidateAll(); toast({ title: t("babies.entryDeleted") }); } });
  }

  function handleDeleteSleep(id: number) {
    if (!confirm(t("babies.deleteConfirm"))) return;
    deleteSleep.mutate({ id }, { onSuccess: () => {
      if (sleepActive?.logId === id) storeSleep(null);
      invalidateAll();
      toast({ title: t("babies.entryDeleted") });
    }});
  }

  const color = baby.colorHex;

  // Build combined activity list
  type ActivityEntry =
    | { kind: "feeding"; id: number; time: string; label: string }
    | { kind: "diaper"; id: number; time: string; label: string }
    | { kind: "sleep"; id: number; time: string; label: string };

  const activity: ActivityEntry[] = [
    ...(feedingLogs ?? []).map((f) => ({
      kind: "feeding" as const,
      id: f.id,
      time: f.loggedAt,
      label: t(`babies.${f.feedType as FeedType}`) + (f.amount ? ` · ${f.amount} oz` : "") + (f.durationMinutes ? ` · ${f.durationMinutes} min` : ""),
    })),
    ...(diaperLogs ?? []).map((d) => ({
      kind: "diaper" as const,
      id: d.id,
      time: d.loggedAt,
      label: t(`babies.${d.diaperType as DiaperType}`),
    })),
    ...(sleepLogs ?? [])
      .filter((s) => !!s.endTime)
      .map((s) => {
        const mins = s.endTime
          ? Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000)
          : 0;
        return {
          kind: "sleep" as const,
          id: s.id,
          time: s.startTime,
          label: t("babies.sleepMinutes", { n: mins }),
        };
      }),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const isLoading = loadingFeeds || loadingDiapers || loadingSleep;

  return (
    <div className="space-y-6">
      {/* Today summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t("babies.feedings"), value: todaySummary?.feedingCount ?? 0, icon: UtensilsCrossed },
          { label: t("babies.diapers"), value: todaySummary?.diaperCount ?? 0, icon: Droplets },
          { label: t("babies.sleep"), value: todaySummary?.sleepMinutes ? `${todaySummary.sleepMinutes}m` : "0m", icon: Moon },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-muted rounded-xl p-4 text-center">
            <Icon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick action buttons */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">{t("babies.quickLog")}</p>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            className="flex flex-col h-auto py-3 gap-1 border-2"
            style={{ borderColor: `${color}40`, color }}
            onClick={() => setFeedingOpen(true)}
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span className="text-xs font-medium">{t("babies.logFeeding")}</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col h-auto py-3 gap-1 border-2"
            style={{ borderColor: `${color}40`, color }}
            onClick={() => setDiaperOpen(true)}
          >
            <Droplets className="w-5 h-5" />
            <span className="text-xs font-medium">{t("babies.logDiaper")}</span>
          </Button>

          {sleepActive ? (
            <Button
              variant="outline"
              className="flex flex-col h-auto py-3 gap-1 border-2 relative"
              style={{ borderColor: color, color, backgroundColor: `${color}10` }}
              onClick={handleStopSleep}
              disabled={createSleep.isPending || deleteSleep.isPending}
            >
              <Timer className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-medium">{t("babies.stopSleep")}</span>
              <span className="text-[10px] font-normal opacity-70">
                <ElapsedTimer startTime={sleepActive.startTime} />
              </span>
            </Button>
          ) : (
            <Button
              variant="outline"
              className="flex flex-col h-auto py-3 gap-1 border-2"
              style={{ borderColor: `${color}40`, color }}
              onClick={handleStartSleep}
              disabled={createSleep.isPending}
            >
              <Moon className="w-5 h-5" />
              <span className="text-xs font-medium">{t("babies.startSleep")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Activity log */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">{t("babies.recentActivity")}</p>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary opacity-40" />
          </div>
        ) : activity.length === 0 ? (
          <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed border-border">
            <BabyIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">{t("babies.noLogs")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activity.map((entry) => {
              const Icon =
                entry.kind === "feeding" ? UtensilsCrossed
                : entry.kind === "diaper" ? Droplets
                : Moon;
              const kindLabel =
                entry.kind === "feeding" ? t("babies.feeding")
                : entry.kind === "diaper" ? t("babies.diaper")
                : t("babies.sleepEntry");

              return (
                <div
                  key={`${entry.kind}-${entry.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 bg-card rounded-xl border border-border/50 group hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground">{kindLabel}</span>
                      {entry.label && (
                        <span className="text-sm text-muted-foreground"> · {entry.label}</span>
                      )}
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(entry.time), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => {
                      if (entry.kind === "feeding") handleDeleteFeeding(entry.id);
                      else if (entry.kind === "diaper") handleDeleteDiaper(entry.id);
                      else handleDeleteSleep(entry.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Feeding dialog */}
      <Dialog open={feedingOpen} onOpenChange={setFeedingOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("babies.logFeedingTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm font-medium mb-2 block">{t("babies.feedType")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["breast", "bottle", "formula"] as FeedType[]).map((ft) => (
                  <button
                    key={ft}
                    onClick={() => setFeedType(ft)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-colors ${
                      feedType === ft
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {t(`babies.${ft}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1.5 block">{t("babies.amount")}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="e.g. 2.5"
                  value={feedAmount}
                  onChange={(e) => setFeedAmount(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">{t("babies.duration")}</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 15"
                  value={feedDuration}
                  onChange={(e) => setFeedDuration(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">{t("babies.notes")}</Label>
              <Textarea
                rows={2}
                className="resize-none"
                value={feedNotes}
                onChange={(e) => setFeedNotes(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={submitFeeding}
              disabled={createFeeding.isPending}
              style={{ backgroundColor: color, borderColor: color }}
            >
              {createFeeding.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("babies.saveLog")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diaper dialog */}
      <Dialog open={diaperOpen} onOpenChange={setDiaperOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("babies.logDiaperTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm font-medium mb-2 block">{t("babies.feedType")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["wet", "dirty", "both"] as DiaperType[]).map((dt) => (
                  <button
                    key={dt}
                    onClick={() => setDiaperType(dt)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-colors ${
                      diaperType === dt
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {t(`babies.${dt}`)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">{t("babies.notes")}</Label>
              <Textarea
                rows={2}
                className="resize-none"
                value={diaperNotes}
                onChange={(e) => setDiaperNotes(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={submitDiaper}
              disabled={createDiaper.isPending}
              style={{ backgroundColor: color, borderColor: color }}
            >
              {createDiaper.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("babies.saveLog")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Babies() {
  const { t } = useTranslation();
  const { data: babies, isLoading } = useGetBabies();
  const [activeBabyId, setActiveBabyId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (babies && babies.length > 0 && !activeBabyId) {
      setActiveBabyId(babies[0].id.toString());
    }
  }, [babies, activeBabyId]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  if (!babies || babies.length === 0) {
    return (
      <div className="p-8 text-center">
        <BabyIcon className="w-12 h-12 mx-auto text-muted-foreground opacity-30 mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">{t("babies.noBabiesTitle")}</h2>
        <p className="text-muted-foreground mb-6">{t("babies.noBabiesDesc")}</p>
        <Link href="/settings">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            {t("babies.goToSettings")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 animate-in fade-in duration-500 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <BabyIcon className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-serif font-bold">{t("babies.title")}</h1>
      </div>

      <Tabs value={activeBabyId} onValueChange={setActiveBabyId}>
        <TabsList className={`grid w-full h-12 mb-6`} style={{ gridTemplateColumns: `repeat(${babies.length}, 1fr)` }}>
          {babies.map((baby) => (
            <TabsTrigger
              key={baby.id}
              value={baby.id.toString()}
              className="text-base data-[state=active]:bg-background data-[state=active]:shadow font-medium"
              style={{
                borderBottomColor: activeBabyId === baby.id.toString() ? baby.colorHex : "transparent",
                borderBottomWidth: activeBabyId === baby.id.toString() ? "2px" : "0",
                color: activeBabyId === baby.id.toString() ? baby.colorHex : undefined,
              }}
            >
              {baby.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {babies.map((baby) => (
          <TabsContent key={baby.id} value={baby.id.toString()}>
            <BabyPanel baby={baby} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
