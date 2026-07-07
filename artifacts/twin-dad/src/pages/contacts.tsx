import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useGetContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from "@workspace/api-client-react";
import type { Contact } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Phone, Mail, Pencil, Trash2, UserRound, X } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  "OB-GYN": "bg-rose-100 text-rose-700",
  "Pediatrician": "bg-blue-100 text-blue-700",
  "Midwife": "bg-purple-100 text-purple-700",
  "Hospital": "bg-amber-100 text-amber-700",
  "Family": "bg-green-100 text-green-700",
  "Emergency": "bg-red-100 text-red-700",
};

function roleColor(role: string) {
  return ROLE_COLORS[role] ?? "bg-muted text-muted-foreground";
}

interface FormState {
  name: string;
  role: string;
  phone: string;
  email: string;
  notes: string;
}

const EMPTY: FormState = { name: "", role: "", phone: "", email: "", notes: "" };

export default function Contacts() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: contacts = [], refetch } = useGetContacts();
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();
  const deleteMutation = useDeleteContact();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  }

  function openEdit(c: Contact) {
    setEditing(c);
    setForm({ name: c.name, role: c.role, phone: c.phone ?? "", email: c.email ?? "", notes: c.notes ?? "" });
    setShowForm(true);
  }

  function handleClose() {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name: form.name.trim(),
      role: form.role.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      notes: form.notes.trim() || null,
    };
    if (!data.name || !data.role) return;

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data },
        {
          onSuccess: () => {
            refetch();
            handleClose();
            toast({ title: t("contacts.updated") });
          },
        }
      );
    } else {
      createMutation.mutate(
        { data },
        {
          onSuccess: () => {
            refetch();
            handleClose();
            toast({ title: t("contacts.added") });
          },
        }
      );
    }
  }

  function handleDelete(id: number) {
    deleteMutation.mutate({ id }, { onSuccess: () => refetch() });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">{t("contacts.title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("contacts.subtitle")}</p>
        </div>
        <Button onClick={openAdd} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          {t("contacts.add")}
        </Button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">{editing ? t("contacts.editContact") : t("contacts.newContact")}</h2>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-foreground">{t("contacts.name")} *</label>
                  <input
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder={t("contacts.namePlaceholder")}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-foreground">{t("contacts.role")} *</label>
                  <input
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    placeholder={t("contacts.rolePlaceholder")}
                    list="role-suggestions"
                    required
                  />
                  <datalist id="role-suggestions">
                    <option value="OB-GYN" />
                    <option value="Pediatrician" />
                    <option value="Midwife" />
                    <option value="Hospital" />
                    <option value="Family" />
                    <option value="Emergency" />
                    <option value="Doula" />
                    <option value="Anesthesiologist" />
                  </datalist>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">{t("contacts.phone")}</label>
                  <input
                    type="tel"
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+1 555 000 0000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">{t("contacts.email")}</label>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="doctor@hospital.com"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-foreground">{t("contacts.notes")}</label>
                  <textarea
                    className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder={t("contacts.notesPlaceholder")}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                  {t("contacts.cancel")}
                </Button>
                <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editing ? t("contacts.save") : t("contacts.addContact")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact list */}
      {contacts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <UserRound className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{t("contacts.empty")}</p>
          <Button variant="outline" size="sm" onClick={openAdd} className="mt-4">
            <Plus className="w-4 h-4 mr-1" /> {t("contacts.addFirst")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {contacts.map((c) => (
            <div key={c.id} className="rounded-2xl border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{c.name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor(c.role)}`}>
                      {c.role}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(c)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-sm text-foreground hover:text-primary">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    {c.phone}
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-sm text-foreground hover:text-primary truncate">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </a>
                )}
                {c.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
