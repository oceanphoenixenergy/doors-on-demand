import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { QuoteSubmission } from "@shared/schema";
import { LogOut, PoundSterling, Phone, DoorOpen, Loader2, GripVertical, User } from "lucide-react";

const PIPELINE_STAGES = [
  { key: "new_lead", label: "New Lead", color: "#6366f1", bgColor: "#eef2ff" },
  { key: "quoted", label: "Quoted", color: "#0ea5e9", bgColor: "#f0f9ff" },
  { key: "follow_up", label: "Follow Up", color: "#f59e0b", bgColor: "#fffbeb" },
  { key: "sizes_submitted", label: "Sizes Done", color: "#8b5cf6", bgColor: "#f5f3ff" },
  { key: "booked", label: "Booked", color: "#10b981", bgColor: "#ecfdf5" },
  { key: "completed", label: "Completed", color: "#059669", bgColor: "#d1fae5" },
  { key: "lost", label: "Lost", color: "#ef4444", bgColor: "#fef2f2" },
] as const;

type PipelineStageKey = typeof PIPELINE_STAGES[number]["key"];

export default function AdminPipeline() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const dragCounter = useRef<Record<string, number>>({});

  const { data: auth, isLoading: authLoading } = useQuery<{ authenticated: boolean } | null>({
    queryKey: ["/api/admin/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: customers = [], isLoading } = useQuery<QuoteSubmission[]>({
    queryKey: ["/api/admin/customers"],
    enabled: !!auth?.authenticated,
  });

  const mutation = useMutation({
    mutationFn: async ({ id, pipelineStage }: { id: string; pipelineStage: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/customers/${id}/pipeline-stage`, { pipelineStage });
      return res.json();
    },
    onMutate: async ({ id, pipelineStage }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/admin/customers"] });
      const prev = queryClient.getQueryData<QuoteSubmission[]>(["/api/admin/customers"]);
      queryClient.setQueryData<QuoteSubmission[]>(["/api/admin/customers"], (old) =>
        old?.map((c) => (c.id === id ? { ...c, pipelineStage } : c))
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["/api/admin/customers"], context.prev);
      }
      toast({ title: "Failed to move customer", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers"] });
    },
  });

  const handleLogout = async () => {
    await apiRequest("POST", "/api/admin/logout");
    queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
    setLocation("/admin");
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!auth?.authenticated) { setLocation("/admin"); return null; }

  const grouped: Record<PipelineStageKey, QuoteSubmission[]> = {
    new_lead: [], quoted: [], follow_up: [], sizes_submitted: [], booked: [], completed: [], lost: [],
  };
  customers.forEach((c) => {
    const stage = (c.pipelineStage || "new_lead") as PipelineStageKey;
    if (grouped[stage]) grouped[stage].push(c);
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = "1";
    setDraggedId(null);
    setDragOverStage(null);
    dragCounter.current = {};
  };

  const handleDragEnter = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    dragCounter.current[stageKey] = (dragCounter.current[stageKey] || 0) + 1;
    setDragOverStage(stageKey);
  };

  const handleDragLeave = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    dragCounter.current[stageKey] = (dragCounter.current[stageKey] || 0) - 1;
    if (dragCounter.current[stageKey] <= 0) {
      dragCounter.current[stageKey] = 0;
      if (dragOverStage === stageKey) setDragOverStage(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    const customer = customers.find((c) => c.id === id);
    if (customer && (customer.pipelineStage || "new_lead") !== stageKey) {
      mutation.mutate({ id, pipelineStage: stageKey });
    }
    setDragOverStage(null);
    setDraggedId(null);
    dragCounter.current = {};
  };

  const stageTotal = (stage: PipelineStageKey) =>
    grouped[stage].reduce((sum, c) => sum + (c.grandTotal || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="max-w-[100rem] mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-lg font-semibold" data-testid="text-pipeline-title" style={{ color: "hsl(193 100% 45%)" }}>
            Doors On Demand Admin
          </h1>
          <div className="flex items-center gap-2">
            <Link href="/admin/pipeline">
              <Button variant="ghost" size="sm" className="font-bold underline" data-testid="link-pipeline">Pipeline</Button>
            </Link>
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm" data-testid="link-customers">Customers</Button>
            </Link>
            <Link href="/admin/calendar">
              <Button variant="ghost" size="sm" data-testid="link-calendar">Calendar</Button>
            </Link>
            <Link href="/admin/campaigns">
              <Button variant="ghost" size="sm" data-testid="link-campaigns">Campaigns</Button>
            </Link>
            <Link href="/admin/templates">
              <Button variant="ghost" size="sm" data-testid="link-templates">Templates</Button>
            </Link>
            <Link href="/admin/gallery">
              <Button variant="ghost" size="sm" data-testid="link-gallery">Gallery</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[100rem] mx-auto px-4 py-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold" data-testid="text-pipeline-heading">Sales Pipeline</h2>
          <p className="text-sm text-muted-foreground">Drag and drop customers between stages</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 200px)" }}>
            {PIPELINE_STAGES.map((stage) => (
              <div
                key={stage.key}
                className="flex-shrink-0 flex flex-col rounded-lg border"
                style={{
                  width: 240,
                  backgroundColor: dragOverStage === stage.key ? stage.bgColor : "hsl(var(--card))",
                  borderColor: dragOverStage === stage.key ? stage.color : undefined,
                  transition: "background-color 0.15s, border-color 0.15s",
                }}
                data-testid={`pipeline-column-${stage.key}`}
                onDragEnter={(e) => handleDragEnter(e, stage.key)}
                onDragLeave={(e) => handleDragLeave(e, stage.key)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.key)}
              >
                <div className="p-3 border-b rounded-t-lg" style={{ backgroundColor: stage.bgColor }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-sm font-semibold" data-testid={`text-stage-label-${stage.key}`}>{stage.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs" data-testid={`badge-count-${stage.key}`}>
                      {grouped[stage.key].length}
                    </Badge>
                  </div>
                  {stageTotal(stage.key) > 0 && (
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1" data-testid={`text-total-${stage.key}`}>
                      <PoundSterling className="w-3 h-3" />
                      £{stageTotal(stage.key).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex-1 p-2 space-y-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
                  {grouped[stage.key].length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-8 opacity-50" data-testid={`text-empty-${stage.key}`}>
                      No customers
                    </div>
                  )}
                  {grouped[stage.key].map((customer) => (
                    <Card
                      key={customer.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, customer.id)}
                      onDragEnd={handleDragEnd}
                      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                      style={{
                        opacity: draggedId === customer.id ? 0.5 : 1,
                      }}
                      data-testid={`card-customer-${customer.id}`}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium truncate" data-testid={`text-name-${customer.id}`}>
                              {customer.firstName} {customer.lastName || ""}
                            </span>
                          </div>
                        </div>

                        {customer.grandTotal > 0 && (
                          <div className="flex items-center gap-1 text-xs" data-testid={`text-value-${customer.id}`}>
                            <PoundSterling className="w-3 h-3 text-green-600" />
                            <span className="font-semibold text-green-700">£{customer.grandTotal.toLocaleString()}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1">
                          {customer.totalDoors > 0 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0" data-testid={`badge-doors-${customer.id}`}>
                              <DoorOpen className="w-2.5 h-2.5 mr-0.5" />
                              {customer.totalDoors}
                            </Badge>
                          )}
                          {customer.doorStyle && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0" data-testid={`badge-style-${customer.id}`}>
                              {customer.doorStyle}
                            </Badge>
                          )}
                          {customer.leadSource && customer.leadSource !== "calculator" && (
                            <Badge
                              className="text-[10px] px-1.5 py-0"
                              style={{ backgroundColor: customer.leadSource === "meta" ? "#1877F2" : "#6b7280", color: "white" }}
                              data-testid={`badge-source-${customer.id}`}
                            >
                              {customer.leadSource}
                            </Badge>
                          )}
                        </div>

                        {(customer.tags || []).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {(customer.tags || []).slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0" data-testid={`badge-tag-${customer.id}-${tag}`}>
                                {tag}
                              </Badge>
                            ))}
                            {(customer.tags || []).length > 3 && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                +{(customer.tags || []).length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {customer.mobile && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground" data-testid={`text-mobile-${customer.id}`}>
                            <Phone className="w-2.5 h-2.5" />
                            {customer.mobile}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
