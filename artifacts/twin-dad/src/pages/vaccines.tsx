import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetBabies, useGetVaccineSchedule, useRecordVaccine, useDeleteVaccineRecord } from "@workspace/api-client-react";
import { CheckCircle2, Circle, Shield, Baby, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

function groupByAge(schedule: ReturnType<typeof useGetVaccineSchedule>["data"]) {
  const groups: Record<number, typeof schedule> = {};
  for (const item of schedule ?? []) {
    if (!groups[item.ageMonths]) groups[item.ageMonths] = [];
    groups[item.ageMonths]!.push(item);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([age, items]) => ({ ageMonths: Number(age), items: items! }));
}

function ageLabel(months: number, t: (k: string, o?: object) => string) {
  if (months === 0) return t("vaccines.atBirth");
  if (months < 12) return t("vaccines.months", { count: months });
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (m === 0) return t("vaccines.years", { count: y });
  return t("vaccines.yearsMonths", { years: y, months: m });
}

export default function Vaccines() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: babies = [] } = useGetBabies();
  const [selectedBaby, setSelectedBaby] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const activeBabyId = selectedBaby ?? (babies[0]?.id ?? undefined);

  const { data: schedule = [], refetch } = useGetVaccineSchedule(
    { babyId: activeBabyId! },
    { query: { enabled: !!activeBabyId } }
  );
  const recordMutation = useRecordVaccine();
  const deleteMutation = useDeleteVaccineRecord();

  const groups = groupByAge(schedule);
  const doneCount = schedule.filter((v) => v.givenDate).length;
  const total = schedule.length;

  function handleToggle(key: string, recordId: number | null | undefined, givenDate: string | null | undefined) {
    if (!activeBabyId) return;
    if (givenDate && recordId) {
      deleteMutation.mutate({ id: recordId }, { onSuccess: () => refetch() });
    } else {
      recordMutation.mutate(
        { data: { babyId: activeBabyId, vaccineKey: key, givenDate: format(new Date(), "yyyy-MM-dd") } },
        {
          onSuccess: () => {
            refetch();
            toast({ title: t("vaccines.recorded") });
          },
        }
      );
    }
  }

  function toggleGroup(age: number) {
    setCollapsed((c) => ({ ...c, [age]: !c[age] }));
  }

  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">{t("vaccines.title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("vaccines.subtitle")}</p>
      </div>

      {/* Baby selector */}
      {babies.length > 1 && (
        <div className="flex gap-2">
          {babies.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBaby(b.id)}
              className="px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors"
              style={{
                backgroundColor: activeBabyId === b.id ? b.colorHex : undefined,
                borderColor: b.colorHex,
                color: activeBabyId === b.id ? "#fff" : undefined,
              }}
            >
              <Baby className="w-3.5 h-3.5 inline mr-1" />{b.name}
            </button>
          ))}
        </div>
      )}

      {/* Progress */}
      {total > 0 && (
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">{t("vaccines.progress")}</span>
            </div>
            <span className="text-sm font-bold text-primary">{doneCount}/{total}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(doneCount / total) * 100}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1.5">
            {Math.round((doneCount / total) * 100)}% {t("vaccines.complete")}
          </div>
        </div>
      )}

      {/* Schedule groups */}
      <div className="space-y-3">
        {groups.map(({ ageMonths, items }) => {
          const groupDone = items.filter((i) => i.givenDate).length;
          const allDone = groupDone === items.length;
          const isCollapsed = collapsed[ageMonths] ?? allDone;

          // Determine status color
          const overdue = items.some(
            (i) => !i.givenDate && i.scheduledDate && i.scheduledDate < today
          );
          const upcoming = items.some(
            (i) => !i.givenDate && i.scheduledDate && i.scheduledDate >= today
          );

          const headerColor = allDone
            ? "border-green-200 bg-green-50"
            : overdue
            ? "border-amber-200 bg-amber-50"
            : "border-border bg-card";

          return (
            <div key={ageMonths} className="rounded-2xl border overflow-hidden">
              <button
                onClick={() => toggleGroup(ageMonths)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${headerColor}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    allDone ? "bg-green-500 text-white" : overdue ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {ageMonths === 0 ? "0" : ageMonths < 12 ? ageMonths : `${Math.floor(ageMonths / 12)}a`}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{ageLabel(ageMonths, t)}</div>
                    {items[0]?.scheduledDate && (
                      <div className="text-xs text-muted-foreground">{t("vaccines.scheduled")} {items[0].scheduledDate}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{groupDone}/{items.length}</span>
                  {isCollapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {!isCollapsed && (
                <div className="divide-y border-t">
                  {items.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleToggle(item.key, item.recordId, item.givenDate)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      {item.givenDate ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${item.givenDate ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {item.name}
                        </div>
                        {item.givenDate && (
                          <div className="text-xs text-green-600">{t("vaccines.given")} {item.givenDate}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {schedule.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{t("vaccines.noBaby")}</p>
        </div>
      )}
    </div>
  );
}
