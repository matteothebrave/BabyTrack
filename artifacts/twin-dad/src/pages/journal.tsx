import React from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { 
  useGetJournalEntries, 
  useCreateJournalEntry, 
  useDeleteJournalEntry,
  getGetJournalEntriesQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, Clock, Trash2 } from "lucide-react";

export default function Journal() {
  const { t } = useTranslation();

  const entrySchema = z.object({
    title: z.string().min(1, t("journal.validation.titleRequired")),
    content: z.string().min(1, t("journal.validation.contentRequired")),
  });

  const { data: entries, isLoading } = useGetJournalEntries();
  const createEntry = useCreateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof entrySchema>>({
    resolver: zodResolver(entrySchema),
    defaultValues: { title: "", content: "" },
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  function onSubmit(values: z.infer<typeof entrySchema>) {
    createEntry.mutate({
      data: { ...values, entryDate: new Date().toISOString() }
    }, {
      onSuccess: () => {
        form.reset();
        queryClient.invalidateQueries({ queryKey: getGetJournalEntriesQueryKey() });
        toast({ title: t("journal.entrySaved") });
      }
    });
  }

  function handleDelete(id: number) {
    if (confirm(t("journal.deleteConfirm"))) {
      deleteEntry.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetJournalEntriesQueryKey() });
          toast({ title: t("journal.entryDeleted") });
        }
      });
    }
  }

  return (
    <div className="p-6 md:p-8 animate-in fade-in duration-500 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <BookOpen className="w-8 h-8 text-primary" />
        <h1 className="text-4xl font-serif font-bold">{t("journal.title")}</h1>
      </div>
      <p className="text-muted-foreground text-lg">{t("journal.subtitle")}</p>

      <Card className="border-border/50 shadow-sm bg-[#faf9f5]">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder={t("journal.entryTitlePlaceholder")}
                        className="text-lg font-serif border-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="h-px bg-border/50 w-full" />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder={t("journal.contentPlaceholder")}
                        className="min-h-[150px] resize-none border-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base leading-relaxed placeholder:text-muted-foreground/50"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={createEntry.isPending} className="rounded-full px-6">
                  {createEntry.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("journal.saveEntry")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-6 mt-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {entries?.map(entry => (
          <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
              <Clock className="w-4 h-4" />
            </div>
            <Card className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground mb-1 font-medium tracking-wider uppercase">
                    {format(new Date(entry.entryDate), "MMMM d, yyyy")}
                  </div>
                  <CardTitle className="text-xl">{entry.title}</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDelete(entry.id)}
                  className="text-muted-foreground hover:text-destructive h-8 w-8 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80 whitespace-pre-wrap">{entry.content}</p>
              </CardContent>
            </Card>
          </div>
        ))}

        {entries?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground relative z-10">
            <p>{t("journal.noEntries")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
