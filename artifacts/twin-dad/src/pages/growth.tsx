import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetBabies, useGetGrowthEntries, useCreateGrowthEntry, useDeleteGrowthEntry } from "@workspace/api-client-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Plus, Trash2, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface FormState {
  date: string;
  weightKg: string;
  heightCm: string;
  headCm: string;
  notes: string;
}

const EMPTY: FormState = {
  date: format(new Date(), "yyyy-MM-dd"),
  weightKg: "",
  heightCm: "",
  headCm: "",
  notes: "",
};

export default function Growth() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: babies = [] } = useGetBabies();
  const [selectedBaby, setSelectedBaby] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const activeBabyId = selectedBaby ?? (babies[0]?.id ?? undefined);
  const activeBaby = babies.find((b) => b.id === activeBabyId);

  const { data: entries = [], refetch } = useGetGrowthEntries(
    { babyId: activeBabyId },
    { query: { enabled: !!activeBabyId } }
  );
  const createMutation = useCreateGrowthEntry();
  const deleteMutation = useDeleteGrowthEntry();

  const chartData = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date: e.date.slice(5), // MM-DD
      [t("growth.weight")]: e.weightKg,
      [t("growth.height")]: e.heightCm,
      [t("growth.head")]: e.headCm,
    }));

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!activeBabyId || !form.date) return;
    createMutation.mutate(
      {
        data: {
          babyId: activeBabyId,
          date: form.date,
          weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
          heightCm: form.heightCm ? parseFloat(form.heightCm) : null,
          headCm: form.headCm ? parseFloat(form.headCm) : null,
          notes: form.notes || null,
        },
      },
      {
        onSuccess: () => {
          refetch();
          setShowForm(false);
          setForm(EMPTY);
          toast({ title: t("growth.saved") });
        },
      }
    );
  }

  function handleDelete(id: number) {
    deleteMutation.mutate({ id }, { onSuccess: () => refetch() });
  }

  const latest = entries[0];

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">{t("growth.title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("growth.subtitle")}</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> {t("growth.add")}
        </Button>
      </div>

      {/* Baby tabs */}
      {babies.length > 1 && (
        <div className="flex gap-2">
          {babies.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBaby(b.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors`}
              style={{
                backgroundColor: activeBabyId === b.id ? b.colorHex : undefined,
                borderColor: b.colorHex,
                color: activeBabyId === b.id ? "#fff" : undefined,
              }}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl shadow-lg w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">{t("growth.newEntry")}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-medium">{t("growth.date")} *</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-sm font-medium">{t("growth.weightKg")}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.weightKg}
                    onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
                    placeholder="3.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t("growth.heightCm")}</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.heightCm}
                    onChange={(e) => setForm((f) => ({ ...f, heightCm: e.target.value }))}
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t("growth.headCm")}</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.headCm}
                    onChange={(e) => setForm((f) => ({ ...f, headCm: e.target.value }))}
                    placeholder="35"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">{t("growth.notes")}</label>
                <input
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder={t("growth.notesPlaceholder")}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                  {t("growth.cancel")}
                </Button>
                <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                  {t("growth.save")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Latest stats */}
      {latest && (
        <div className="grid grid-cols-3 gap-3">
          {latest.weightKg != null && (
            <div className="rounded-2xl border bg-card p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{latest.weightKg} kg</div>
              <div className="text-xs text-muted-foreground mt-1">{t("growth.weight")}</div>
            </div>
          )}
          {latest.heightCm != null && (
            <div className="rounded-2xl border bg-card p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{latest.heightCm} cm</div>
              <div className="text-xs text-muted-foreground mt-1">{t("growth.height")}</div>
            </div>
          )}
          {latest.headCm != null && (
            <div className="rounded-2xl border bg-card p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{latest.headCm} cm</div>
              <div className="text-xs text-muted-foreground mt-1">{t("growth.head")}</div>
            </div>
          )}
        </div>
      )}

      {/* Weight chart */}
      {chartData.length >= 2 && (
        <div className="rounded-2xl border bg-card p-4">
          <h2 className="font-semibold text-foreground mb-4">{t("growth.weightChart")}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" kg" />
              <Tooltip />
              <Line type="monotone" dataKey={t("growth.weight")} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Height chart */}
      {chartData.length >= 2 && (
        <div className="rounded-2xl border bg-card p-4">
          <h2 className="font-semibold text-foreground mb-4">{t("growth.heightChart")}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit=" cm" />
              <Tooltip />
              <Line type="monotone" dataKey={t("growth.height")} stroke="hsl(var(--primary) / 0.7)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History table */}
      {entries.length > 0 && (
        <div>
          <h2 className="font-semibold text-foreground mb-3">{t("growth.history")}</h2>
          <div className="space-y-2">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{e.date}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {e.weightKg != null && `${e.weightKg} kg`}
                    {e.heightCm != null && ` · ${e.heightCm} cm`}
                    {e.headCm != null && ` · PC ${e.headCm} cm`}
                  </div>
                </div>
                <button onClick={() => handleDelete(e.id)} className="text-muted-foreground hover:text-destructive p-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{t("growth.empty")}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" /> {t("growth.addFirst")}
          </Button>
        </div>
      )}
    </div>
  );
}
