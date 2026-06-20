import React, { useState } from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import {
  useGetChecklistItems,
  useCreateChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
  useGetAppointments,
  useCreateAppointment,
  useDeleteAppointment,
  getGetChecklistItemsQueryKey,
  getGetAppointmentsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CheckSquare,
  Square,
  Loader2,
  Plus,
  Trash2,
  CalendarDays,
  MapPin,
  X,
} from "lucide-react";

type Category = "hospital-bag" | "nursery" | "supplies";

function ChecklistSection({ category, label }: { category: Category; label: string }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newItem, setNewItem] = useState("");

  const { data: items, isLoading } = useGetChecklistItems(
    { category },
    { query: { queryKey: getGetChecklistItemsQueryKey({ category }) } }
  );

  const createItem = useCreateChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const deleteItem = useDeleteChecklistItem();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getGetChecklistItemsQueryKey({ category }) });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = newItem.trim();
    if (!title) return;
    createItem.mutate(
      { data: { category, title } },
      { onSuccess: () => { setNewItem(""); invalidate(); } }
    );
  }

  function handleToggle(id: number, completed: boolean) {
    updateItem.mutate(
      { id, data: { completed: !completed } },
      { onSuccess: () => invalidate() }
    );
  }

  function handleDelete(id: number) {
    if (!confirm(t("prepare.deleteItemConfirm"))) return;
    deleteItem.mutate({ id }, { onSuccess: () => invalidate() });
  }

  const total = items?.length ?? 0;
  const done = items?.filter((i) => i.completed).length ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{label}</CardTitle>
          <span className="text-sm font-medium text-muted-foreground">
            {t("prepare.progress", { done, total })}
          </span>
        </div>
        <Progress value={pct} className="h-1.5 mt-1" />
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary opacity-40" />
          </div>
        ) : (
          <>
            {(items ?? []).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-2 px-1 rounded-lg group hover:bg-muted/50 transition-colors"
              >
                <button
                  onClick={() => handleToggle(item.id, item.completed)}
                  className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                  aria-label={item.completed ? "Uncheck" : "Check"}
                >
                  {item.completed ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
                <span
                  className={`flex-1 text-sm transition-colors ${
                    item.completed ? "line-through text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {item.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(item.id)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </>
        )}

        <form onSubmit={handleAdd} className="flex gap-2 pt-3 border-t border-border/50 mt-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder={t("prepare.addPlaceholder")}
            className="text-sm h-8"
          />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            disabled={createItem.isPending || !newItem.trim()}
            className="shrink-0 h-8"
          >
            {createItem.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AppointmentsSection() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

  const { data: appointments, isLoading } = useGetAppointments({
    query: { queryKey: getGetAppointmentsQueryKey() },
  });

  const createAppt = useCreateAppointment();
  const deleteAppt = useDeleteAppointment();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getGetAppointmentsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  }

  function handleSave() {
    if (!title.trim() || !date) return;
    createAppt.mutate(
      { data: { title: title.trim(), appointmentDate: date, location: location.trim() || null, notes: null } },
      {
        onSuccess: () => {
          setOpen(false);
          setTitle("");
          setDate("");
          setLocation("");
          invalidate();
          toast({ title: t("prepare.appointmentSaved") });
        },
      }
    );
  }

  function handleDelete(id: number) {
    if (!confirm(t("prepare.deleteApptConfirm"))) return;
    deleteAppt.mutate({ id }, {
      onSuccess: () => {
        invalidate();
        toast({ title: t("prepare.appointmentDeleted") });
      },
    });
  }

  const today = new Date().toISOString().split("T")[0];
  const upcoming = (appointments ?? []).filter((a) => a.appointmentDate >= today);
  const past = (appointments ?? []).filter((a) => a.appointmentDate < today);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-secondary" />
            {t("prepare.appointments")}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="h-8 gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            {t("prepare.addAppointment")}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary opacity-40" />
          </div>
        ) : (appointments ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t("prepare.noAppointments")}</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((apt) => (
              <AppointmentRow key={apt.id} apt={apt} onDelete={handleDelete} isPast={false} />
            ))}
            {past.length > 0 && upcoming.length > 0 && (
              <div className="border-t border-dashed border-border/60 my-3" />
            )}
            {past.map((apt) => (
              <AppointmentRow key={apt.id} apt={apt} onDelete={handleDelete} isPast />
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("prepare.addAppointment")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm mb-1.5 block">{t("prepare.apptTitleLabel")}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("prepare.apptTitlePlaceholder")}
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">{t("prepare.apptDateLabel")}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">{t("prepare.apptLocationLabel")}</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Hospital, clinic..."
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={createAppt.isPending || !title.trim() || !date}
            >
              {createAppt.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("prepare.saveAppointment")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function AppointmentRow({
  apt,
  onDelete,
  isPast,
}: {
  apt: { id: number; title: string; appointmentDate: string; location?: string | null };
  onDelete: (id: number) => void;
  isPast: boolean;
}) {
  const dateObj = new Date(apt.appointmentDate + "T12:00:00");
  return (
    <div
      className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border group hover:shadow-sm transition-shadow ${
        isPast ? "border-border/30 opacity-50" : "border-border/50"
      }`}
    >
      <div className="flex flex-col items-center justify-center bg-secondary/10 text-secondary rounded-lg w-11 h-11 shrink-0">
        <span className="text-[10px] font-bold uppercase leading-none">
          {format(dateObj, "MMM")}
        </span>
        <span className="text-lg font-bold leading-none">{format(dateObj, "d")}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{apt.title}</p>
        {apt.location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            {apt.location}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
        onClick={() => onDelete(apt.id)}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

export default function Prepare() {
  const { t } = useTranslation();

  return (
    <div className="p-6 md:p-8 animate-in fade-in duration-500 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <CheckSquare className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-serif font-bold">{t("prepare.title")}</h1>
      </div>

      <ChecklistSection category="hospital-bag" label={t("prepare.hospitalBag")} />
      <ChecklistSection category="nursery" label={t("prepare.nursery")} />
      <ChecklistSection category="supplies" label={t("prepare.supplies")} />
      <AppointmentsSection />
    </div>
  );
}
