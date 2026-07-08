import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useGetFeedingLogs, useGetSleepLogs, useGetBabies } from "@workspace/api-client-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { subDays, format, parseISO, differenceInMinutes, startOfDay } from "date-fns";
import { BarChart2, Baby } from "lucide-react";

const PERIOD_OPTIONS = [7, 30] as const;
type Period = (typeof PERIOD_OPTIONS)[number];

function dayKey(date: Date) {
  return format(date, "MM/dd");
}

export default function Charts() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>(7);
  const [selectedBaby, setSelectedBaby] = useState<number | null>(null);

  const { data: babies = [] } = useGetBabies();
  const activeBabyId = selectedBaby ?? (babies[0]?.id ?? undefined);

  const { data: feedingLogs = [] } = useGetFeedingLogs(
    { babyId: activeBabyId, limit: 500 },
    { query: { enabled: !!activeBabyId } }
  );
  const { data: sleepLogs = [] } = useGetSleepLogs(
    { babyId: activeBabyId, limit: 500 },
    { query: { enabled: !!activeBabyId } }
  );

  const days = useMemo(() => {
    return Array.from({ length: period }, (_, i) => {
      const d = subDays(new Date(), period - 1 - i);
      return { date: d, key: dayKey(d) };
    });
  }, [period]);

  // Feeding: count per day + avg interval in hours
  const feedingData = useMemo(() => {
    const cutoff = subDays(new Date(), period);
    const recent = feedingLogs.filter((f) => new Date(f.loggedAt) >= cutoff);

    return days.map(({ date, key }) => {
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayLogs = recent.filter((f) => {
        const t = new Date(f.loggedAt);
        return t >= dayStart && t < dayEnd;
      }).sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());

      let avgInterval: number | null = null;
      if (dayLogs.length >= 2) {
        const intervals = dayLogs.slice(1).map((l, i) =>
          differenceInMinutes(new Date(l.loggedAt), new Date(dayLogs[i].loggedAt)) / 60
        );
        avgInterval = Math.round((intervals.reduce((a, b) => a + b, 0) / intervals.length) * 10) / 10;
      }

      return { day: key, feedings: dayLogs.length, avgInterval };
    });
  }, [feedingLogs, days, period]);

  // Next feeding estimate
  const nextFeedingIn = useMemo(() => {
    if (feedingLogs.length < 3) return null;
    const recent = feedingLogs.slice(0, 10).sort((a, b) =>
      new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()
    );
    if (recent.length < 2) return null;
    const intervals = recent.slice(1).map((l, i) =>
      differenceInMinutes(new Date(l.loggedAt), new Date(recent[i].loggedAt))
    );
    const avgMinutes = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const last = new Date(feedingLogs[0].loggedAt);
    const nextTime = new Date(last.getTime() + avgMinutes * 60000);
    const minutesLeft = differenceInMinutes(nextTime, new Date());
    return minutesLeft;
  }, [feedingLogs]);

  // Sleep: total hours per day + sessions count
  const sleepData = useMemo(() => {
    const cutoff = subDays(new Date(), period);
    const recent = sleepLogs.filter((s) => new Date(s.startTime) >= cutoff);

    return days.map(({ date, key }) => {
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayLogs = recent.filter((s) => {
        const t = new Date(s.startTime);
        return t >= dayStart && t < dayEnd;
      });

      const totalHours = dayLogs.reduce((sum, s) => {
        if (!s.endTime) return sum;
        return sum + differenceInMinutes(new Date(s.endTime), new Date(s.startTime)) / 60;
      }, 0);

      return { day: key, sessions: dayLogs.length, totalHours: Math.round(totalHours * 10) / 10 };
    });
  }, [sleepLogs, days, period]);

  function nextFeedingLabel(min: number | null) {
    if (min === null) return null;
    if (min < 0) return t("charts.overdue");
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h > 0) return `${h}h ${m}min`;
    return `${m}min`;
  }

  return (
    <div className="p-6 space-y-8 max-w-2xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">{t("charts.title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("charts.subtitle")}</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* Baby selector */}
      {babies.length > 1 && (
        <div className="flex gap-2">
          {babies.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBaby(b.id)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors"
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

      {/* Next feeding card */}
      {nextFeedingIn !== null && (
        <div className={`rounded-2xl border p-4 flex items-center justify-between ${
          nextFeedingIn < 0 ? "bg-amber-50 border-amber-200" : "bg-card"
        }`}>
          <div>
            <div className="text-sm font-medium text-muted-foreground">{t("charts.nextFeeding")}</div>
            <div className={`text-2xl font-bold mt-0.5 ${nextFeedingIn < 0 ? "text-amber-600" : "text-foreground"}`}>
              {nextFeedingIn < 0 ? t("charts.overdue") : `${t("charts.in")} ${nextFeedingLabel(nextFeedingIn)}`}
            </div>
          </div>
          <div className="text-4xl opacity-30">🍼</div>
        </div>
      )}

      {/* Feeding chart */}
      <div className="rounded-2xl border bg-card p-4">
        <h2 className="font-semibold text-foreground mb-4">{t("charts.feedingsPerDay")}</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={feedingData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="day" className="text-xs" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="feedings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={t("charts.feedings")} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Avg interval chart */}
      <div className="rounded-2xl border bg-card p-4">
        <h2 className="font-semibold text-foreground mb-1">{t("charts.avgInterval")}</h2>
        <p className="text-xs text-muted-foreground mb-4">{t("charts.avgIntervalSub")}</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={feedingData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="h" />
            <Tooltip formatter={(v) => [`${v}h`, t("charts.interval")]} />
            <Line type="monotone" dataKey="avgInterval" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name={t("charts.interval")} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sleep chart */}
      <div className="rounded-2xl border bg-card p-4">
        <h2 className="font-semibold text-foreground mb-4">{t("charts.sleepPerDay")}</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sleepData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="h" />
            <Tooltip />
            <Bar dataKey="totalHours" fill="hsl(var(--primary) / 0.6)" radius={[4, 4, 0, 0]} name={t("charts.sleepHours")} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sleep sessions */}
      <div className="rounded-2xl border bg-card p-4">
        <h2 className="font-semibold text-foreground mb-4">{t("charts.sleepSessions")}</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={sleepData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="sessions" stroke="hsl(var(--primary) / 0.7)" strokeWidth={2} dot={{ r: 3 }} name={t("charts.sessions")} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {feedingLogs.length === 0 && sleepLogs.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{t("charts.empty")}</p>
        </div>
      )}
    </div>
  );
}
