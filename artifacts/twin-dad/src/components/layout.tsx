import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetSettings } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import type { AuthUser } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Baby,
  Trophy,
  BookOpen,
  Settings as SettingsIcon,
  Loader2,
  Globe,
  LogOut,
  Timer,
  Contact,
} from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "pt", label: "PT" },
];

interface Props {
  children: React.ReactNode;
  currentUser?: AuthUser;
  onLogout?: () => void;
}

export default function Layout({ children, currentUser, onLogout }: Props) {
  const [location, setLocation] = useLocation();
  const { data: settings, isLoading } = useGetSettings();
  const { t, i18n: i18nInstance } = useTranslation();

  useEffect(() => {
    if (!isLoading && settings && !settings.parentName && location !== "/settings") {
      setLocation("/settings");
    }
  }, [settings, isLoading, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  const navItems = [
    { href: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/babies", label: t("nav.babies"), icon: Baby },
    { href: "/milestones", label: t("nav.milestones"), icon: Trophy },
    { href: "/journal", label: t("nav.journal"), icon: BookOpen },
    { href: "/contractions", label: t("nav.contractions"), icon: Timer },
    { href: "/contacts", label: t("nav.contacts"), icon: Contact },
    { href: "/settings", label: t("nav.settings"), icon: SettingsIcon },
  ];

  function handleLangChange(code: string) {
    i18n.changeLanguage(code);
  }

  const userColor = currentUser?.role === "mom" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-700";

  return (
    <div className="flex min-h-[100dvh] flex-col md:flex-row bg-background">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card px-4 py-6">
        <div className="mb-8 px-4">
          <h1 className="text-2xl font-serif font-bold text-primary">{t("brand.name")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("brand.subtitle")}</p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Language switcher */}
        <div className="mt-4 px-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("language.label")}</span>
          </div>
          <div className="flex gap-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLangChange(lang.code)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  i18nInstance.language === lang.code
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* User + logout */}
        {currentUser && (
          <div className="mt-4 px-4 pt-4 border-t border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${userColor}`}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-foreground truncate">{currentUser.name}</span>
              </div>
              <button
                onClick={onLogout}
                title={t("login.logout")}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 relative">
        <div className="max-w-4xl mx-auto w-full min-h-full">
          {children}
        </div>
      </main>

      {/* Bottom nav for mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card px-2 py-2 flex items-center justify-between z-50 pb-safe">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 rounded-lg w-full ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Lang + logout — mobile */}
        <div className="flex flex-col items-center gap-0.5 px-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLangChange(lang.code)}
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                i18nInstance.language === lang.code
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {lang.label}
            </button>
          ))}
          {onLogout && (
            <button
              onClick={onLogout}
              className="text-muted-foreground hover:text-foreground mt-0.5"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
