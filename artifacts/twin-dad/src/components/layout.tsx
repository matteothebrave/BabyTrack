import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetSettings } from "@workspace/api-client-react";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Baby, 
  Trophy, 
  BookOpen, 
  Settings as SettingsIcon,
  Loader2
} from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: settings, isLoading } = useGetSettings();

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
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/prepare", label: "Prepare", icon: CheckSquare },
    { href: "/babies", label: "Babies", icon: Baby },
    { href: "/milestones", label: "Milestones", icon: Trophy },
    { href: "/journal", label: "Journal", icon: BookOpen },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="flex min-h-[100dvh] flex-col md:flex-row bg-background">
      {/* Sidebar for desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card px-4 py-6">
        <div className="mb-8 px-4">
          <h1 className="text-2xl font-serif font-bold text-primary">Twin Dad</h1>
          <p className="text-sm text-muted-foreground mt-1">Command Center</p>
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
      </nav>
    </div>
  );
}
