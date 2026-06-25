import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { fetchUserStatuses, type UserStatus } from "@/hooks/use-auth";
import { Loader2, Baby, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import i18n from "@/i18n";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "pt", label: "PT" },
];

interface Props {
  onLogin: (role: string, pin: string) => Promise<{ ok: boolean; error?: string }>;
}

export default function Login({ onLogin }: Props) {
  const { t, i18n: i18nInstance } = useTranslation();
  const [statuses, setStatuses] = useState<UserStatus[]>([]);
  const [selected, setSelected] = useState<UserStatus | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUserStatuses().then((s) => {
      setStatuses(s);
      setLoadingStatuses(false);
    });
  }, []);

  useEffect(() => {
    if (selected) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selected]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || pin.length < 4) return;
    setLoading(true);
    setError("");
    const result = await onLogin(selected.role, pin);
    if (!result.ok) {
      setError(result.error === "Incorrect PIN" ? t("login.wrongPin") : t("login.error"));
      setPin("");
      setLoading(false);
    }
  }

  const isCreating = selected && !selected.hasPin;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-6">
      {/* Language switcher */}
      <div className="fixed top-4 right-4 flex gap-1">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
              i18nInstance.language === lang.code
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm space-y-8 animate-in fade-in duration-500">
        {/* Brand */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-8 h-8 text-primary fill-primary/20" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground">{t("brand.name")}</h1>
          <p className="text-muted-foreground mt-1">{t("brand.subtitle")}</p>
        </div>

        {loadingStatuses ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary opacity-40" />
          </div>
        ) : !selected ? (
          /* User selection */
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground font-medium uppercase tracking-wider">
              {t("login.whoIsIt")}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {statuses.map((status) => (
                <button
                  key={status.role}
                  onClick={() => { setSelected(status); setPin(""); setError(""); }}
                  className="group relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                    status.role === "dad"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-600"
                  }`}>
                    {status.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground">{status.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {status.role === "dad" ? t("login.dad") : t("login.mom")}
                    </div>
                  </div>
                  {!status.hasPin && (
                    <span className="absolute top-2 right-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                      {t("login.new")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* PIN entry */
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setSelected(null); setPin(""); setError(""); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ←
              </button>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  selected.role === "dad"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-600"
                }`}>
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{selected.name}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  {isCreating ? t("login.createPin") : t("login.enterPin")}
                </label>
                {isCreating && (
                  <p className="text-xs text-muted-foreground mb-3">{t("login.createPinDesc")}</p>
                )}
                <input
                  ref={inputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  value={pin}
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }}
                  placeholder="••••"
                  className={`w-full text-center text-2xl tracking-[0.5em] font-mono h-14 rounded-xl border-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${
                    error ? "border-destructive" : "border-border focus:border-primary"
                  }`}
                />
                {error && (
                  <p className="text-destructive text-sm mt-2 text-center">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={pin.length < 4 || loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isCreating ? (
                  t("login.setPinAndEnter")
                ) : (
                  t("login.enter")
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
