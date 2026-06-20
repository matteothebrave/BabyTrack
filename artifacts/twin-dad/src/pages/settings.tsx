import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { 
  useGetSettings, 
  useUpdateSettings, 
  useGetBabies, 
  useCreateBaby, 
  useUpdateBaby,
  getGetSettingsQueryKey,
  getGetBabiesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const settingsSchema = z.object({
    parentName: z.string().min(1, t("settings.validation.nameRequired")),
    momName: z.string().min(1, t("settings.validation.partnerRequired")),
    dueDate: z.string().min(1, t("settings.validation.dueDateRequired")),
  });

  const babySchema = z.object({
    name: z.string().min(1, t("settings.validation.babyNameRequired")),
    colorHex: z.string().regex(/^#[0-9A-F]{6}$/i, t("settings.validation.invalidColor")),
    gender: z.string().optional(),
    birthDate: z.string().optional(),
  });

  const { data: settings, isLoading: isLoadingSettings } = useGetSettings();
  const updateSettings = useUpdateSettings();

  const { data: babies, isLoading: isLoadingBabies } = useGetBabies();
  const createBaby = useCreateBaby();
  const updateBaby = useUpdateBaby();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { parentName: "", momName: "", dueDate: "" },
  });

  const baby1Form = useForm<z.infer<typeof babySchema>>({
    resolver: zodResolver(babySchema),
    defaultValues: { name: "", colorHex: "#d97706", gender: "", birthDate: "" },
  });

  const baby2Form = useForm<z.infer<typeof babySchema>>({
    resolver: zodResolver(babySchema),
    defaultValues: { name: "", colorHex: "#2563eb", gender: "", birthDate: "" },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        parentName: settings.parentName || "",
        momName: settings.momName || "",
        dueDate: settings.dueDate ? format(new Date(settings.dueDate), "yyyy-MM-dd") : "",
      });
    }
  }, [settings, form]);

  useEffect(() => {
    if (babies && babies.length >= 1) {
      baby1Form.reset({
        name: babies[0].name || "",
        colorHex: babies[0].colorHex || "#d97706",
        gender: babies[0].gender || "",
        birthDate: babies[0].birthDate ? format(new Date(babies[0].birthDate), "yyyy-MM-dd") : "",
      });
    }
    if (babies && babies.length >= 2) {
      baby2Form.reset({
        name: babies[1].name || "",
        colorHex: babies[1].colorHex || "#2563eb",
        gender: babies[1].gender || "",
        birthDate: babies[1].birthDate ? format(new Date(babies[1].birthDate), "yyyy-MM-dd") : "",
      });
    }
  }, [babies, baby1Form, baby2Form]);

  if (isLoadingSettings || isLoadingBabies) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  async function onSubmitSettings(values: z.infer<typeof settingsSchema>) {
    updateSettings.mutate(
      { data: { ...values, dueDate: new Date(values.dueDate).toISOString() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          toast({ title: t("settings.settingsSaved") });
          if (!settings?.parentName) {
            setLocation("/");
          }
        },
      }
    );
  }

  async function onSaveBaby(values: z.infer<typeof babySchema>, index: number) {
    const existingBaby = babies && babies[index];
    const data = {
      ...values,
      birthDate: values.birthDate ? new Date(values.birthDate).toISOString() : undefined,
    };

    if (existingBaby) {
      updateBaby.mutate(
        { id: existingBaby.id, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetBabiesQueryKey() });
            toast({ title: t("settings.babyUpdated", { n: index + 1 }) });
          },
        }
      );
    } else {
      createBaby.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetBabiesQueryKey() });
            toast({ title: t("settings.babyCreated", { n: index + 1 }) });
          },
        }
      );
    }
  }

  return (
    <div className="p-6 md:p-8 animate-in fade-in duration-500 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <SettingsIcon className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-serif font-bold">{t("settings.title")}</h1>
      </div>
      <p className="text-muted-foreground">{t("settings.subtitle")}</p>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>{t("settings.familyDetails")}</CardTitle>
          <CardDescription>{t("settings.familyDetailsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitSettings)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="parentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.yourName")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("settings.yourName")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="momName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settings.partnerName")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("settings.partnerName")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.dueDate")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateSettings.isPending}>
                {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("settings.saveFamilyDetails")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: t("settings.baby1"), desc: t("settings.baby1Desc"), formInstance: baby1Form, saveLabel: t("settings.saveBaby1"), idx: 0 },
          { label: t("settings.baby2"), desc: t("settings.baby2Desc"), formInstance: baby2Form, saveLabel: t("settings.saveBaby2"), idx: 1 },
        ].map(({ label, desc, formInstance, saveLabel, idx }) => (
          <Card key={idx} className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>{label}</CardTitle>
              <CardDescription>{desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...formInstance}>
                <form onSubmit={formInstance.handleSubmit((v) => onSaveBaby(v, idx))} className="space-y-4">
                  <FormField
                    control={formInstance.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.name")}</FormLabel>
                        <FormControl>
                          <Input placeholder={idx === 0 ? "Baby A" : "Baby B"} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formInstance.control}
                    name="colorHex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.themeColor")}</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input type="color" className="w-12 h-10 p-1" {...field} />
                          </FormControl>
                          <Input type="text" className="flex-1" {...field} />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formInstance.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("settings.birthDate")}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" variant="secondary" className="w-full" disabled={createBaby.isPending || updateBaby.isPending}>
                    {saveLabel}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
