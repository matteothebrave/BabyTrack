import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
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

const settingsSchema = z.object({
  parentName: z.string().min(1, "Name is required"),
  momName: z.string().min(1, "Partner's name is required"),
  dueDate: z.string().min(1, "Due date is required"),
});

const babySchema = z.object({
  name: z.string().min(1, "Baby name is required"),
  colorHex: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  gender: z.string().optional(),
  birthDate: z.string().optional(),
});

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading: isLoadingSettings } = useGetSettings();
  const updateSettings = useUpdateSettings();

  const { data: babies, isLoading: isLoadingBabies } = useGetBabies();
  const createBaby = useCreateBaby();
  const updateBaby = useUpdateBaby();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      parentName: "",
      momName: "",
      dueDate: "",
    },
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
          toast({ title: "Settings saved" });
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
            toast({ title: `Baby ${index + 1} updated` });
          },
        }
      );
    } else {
      createBaby.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetBabiesQueryKey() });
            toast({ title: `Baby ${index + 1} created` });
          },
        }
      );
    }
  }

  return (
    <div className="p-6 md:p-8 animate-in fade-in duration-500 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <SettingsIcon className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-serif font-bold">Settings</h1>
      </div>
      <p className="text-muted-foreground">Configure your command center.</p>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Family Details</CardTitle>
          <CardDescription>Basic information for your command center.</CardDescription>
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
                      <FormLabel>Your Name (Dad)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your name" {...field} />
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
                      <FormLabel>Partner's Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter partner's name" {...field} />
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
                    <FormLabel>Expected Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateSettings.isPending}>
                {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Family Details
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Baby 1</CardTitle>
            <CardDescription>Profile for the first twin.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...baby1Form}>
              <form onSubmit={baby1Form.handleSubmit((v) => onSaveBaby(v, 0))} className="space-y-4">
                <FormField
                  control={baby1Form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Baby A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={baby1Form.control}
                  name="colorHex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme Color</FormLabel>
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
                  control={baby1Form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birth Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" variant="secondary" className="w-full" disabled={createBaby.isPending || updateBaby.isPending}>
                  Save Baby 1
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Baby 2</CardTitle>
            <CardDescription>Profile for the second twin.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...baby2Form}>
              <form onSubmit={baby2Form.handleSubmit((v) => onSaveBaby(v, 1))} className="space-y-4">
                <FormField
                  control={baby2Form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Baby B" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={baby2Form.control}
                  name="colorHex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme Color</FormLabel>
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
                  control={baby2Form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birth Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" variant="secondary" className="w-full" disabled={createBaby.isPending || updateBaby.isPending}>
                  Save Baby 2
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
