import React, { useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useGetBabies, 
  useGetMilestones,
  useCreateMilestone,
  useDeleteMilestone,
  getGetMilestonesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, Plus, Trash2, Calendar, Star } from "lucide-react";

const milestoneSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  achievedAt: z.string().min(1, "Date is required"),
});

const CATEGORIES = [
  { value: "physical", label: "Physical (Crawling, Walking)", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "social", label: "Social (Smiling, Laughing)", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300" },
  { value: "cognitive", label: "Cognitive (Tracking, Finding)", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: "language", label: "Language (Babbling, Words)", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { value: "feeding", label: "Feeding (Solids, Cup)", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
];

export default function Milestones() {
  const { data: babies, isLoading: isLoadingBabies } = useGetBabies();
  const [activeBabyId, setActiveBabyId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Set initial active baby when loaded
  React.useEffect(() => {
    if (babies && babies.length > 0 && activeBabyId === null) {
      setActiveBabyId(babies[0].id);
    }
  }, [babies, activeBabyId]);

  const { data: milestones, isLoading: isLoadingMilestones } = useGetMilestones(
    { babyId: activeBabyId || undefined },
    { query: { enabled: !!activeBabyId, queryKey: getGetMilestonesQueryKey({ babyId: activeBabyId || 0 }) } }
  );

  const createMilestone = useCreateMilestone();
  const deleteMilestone = useDeleteMilestone();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof milestoneSchema>>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: { 
      title: "", 
      description: "", 
      category: "", 
      achievedAt: format(new Date(), "yyyy-MM-dd") 
    },
  });

  if (isLoadingBabies) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  if (!babies || babies.length === 0) {
    return (
      <div className="p-8 text-center">
        <Trophy className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">No Babies Yet</h2>
        <p className="text-muted-foreground">Add your babies in settings to start tracking milestones.</p>
      </div>
    );
  }

  function onSubmit(values: z.infer<typeof milestoneSchema>) {
    if (!activeBabyId) return;

    createMilestone.mutate({
      data: {
        babyId: activeBabyId,
        title: values.title,
        description: values.description || null,
        category: values.category,
        achievedAt: new Date(values.achievedAt).toISOString(),
      }
    }, {
      onSuccess: () => {
        form.reset({
          title: "",
          description: "",
          category: "",
          achievedAt: format(new Date(), "yyyy-MM-dd")
        });
        setIsAdding(false);
        queryClient.invalidateQueries({ queryKey: getGetMilestonesQueryKey({ babyId: activeBabyId }) });
        toast({ title: "Milestone celebrated!" });
      }
    });
  }

  function handleDelete(id: number) {
    if (!activeBabyId) return;
    
    if (confirm("Remove this milestone?")) {
      deleteMilestone.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMilestonesQueryKey({ babyId: activeBabyId }) });
          toast({ title: "Milestone removed" });
        }
      });
    }
  }

  const activeBaby = babies.find(b => b.id === activeBabyId);

  return (
    <div className="p-6 md:p-8 animate-in fade-in duration-500 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-serif font-bold">Milestones</h1>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "outline" : "default"}>
          {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Log First</>}
        </Button>
      </div>

      <Tabs value={activeBabyId?.toString()} onValueChange={(v) => setActiveBabyId(parseInt(v))}>
        <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
          {babies.map((baby) => (
            <TabsTrigger 
              key={baby.id} 
              value={baby.id.toString()}
              className="text-base data-[state=active]:bg-background data-[state=active]:shadow"
              style={{
                borderBottomColor: activeBabyId === baby.id ? baby.colorHex : 'transparent',
                borderBottomWidth: activeBabyId === baby.id ? '2px' : '0'
              }}
            >
              {baby.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {isAdding && (
          <Card className="mb-8 border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader>
              <CardTitle>Log a new first for {activeBaby?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What happened?</FormLabel>
                          <FormControl>
                            <Input placeholder="First smile, rolled over..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CATEGORIES.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="achievedAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>The Story (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="How did it happen? Who was there?" className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={createMilestone.isPending}>
                      {createMilestone.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Milestone
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {babies.map((baby) => (
          <TabsContent key={baby.id} value={baby.id.toString()}>
            {isLoadingMilestones ? (
              <div className="flex py-12 justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
              </div>
            ) : milestones && milestones.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {milestones.map(milestone => {
                  const catInfo = CATEGORIES.find(c => c.value === milestone.category);
                  
                  return (
                    <Card key={milestone.id} className="overflow-hidden border-border/50 hover:shadow-md transition-shadow group">
                      <div className="h-1.5 w-full" style={{ backgroundColor: baby.colorHex }} />
                      <CardHeader className="pb-3 relative">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ${catInfo?.color || 'bg-gray-100 text-gray-800'}`}>
                              {catInfo?.label.split(' ')[0] || milestone.category}
                            </span>
                            <CardTitle className="text-xl font-serif">{milestone.title}</CardTitle>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(milestone.id)}
                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {milestone.description && (
                          <p className="text-muted-foreground text-sm mb-4">{milestone.description}</p>
                        )}
                        <div className="flex items-center text-xs text-muted-foreground font-medium uppercase tracking-wider">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          {format(new Date(milestone.achievedAt), "MMM d, yyyy")}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed border-border">
                <Star className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="text-lg font-medium">No Milestones Yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mt-1">
                  Every little step is worth remembering. Start tracking {baby.name}'s firsts.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-6"
                  onClick={() => setIsAdding(true)}
                >
                  Log First Milestone
                </Button>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
