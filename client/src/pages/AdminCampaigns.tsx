import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import type { EmailCampaign } from "@shared/schema";
import { LogOut, Plus, Loader2, Send, Clock, Tag, X } from "lucide-react";

export default function AdminCampaigns() {
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [targetStatus, setTargetStatus] = useState("all");
  const [scheduleType, setScheduleType] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [includeTags, setIncludeTags] = useState<string[]>([]);
  const [excludeTags, setExcludeTags] = useState<string[]>([]);
  const [newIncludeTag, setNewIncludeTag] = useState("");
  const [newExcludeTag, setNewExcludeTag] = useState("");

  const { data: auth, isLoading: authLoading } = useQuery<{ authenticated: boolean } | null>({
    queryKey: ["/api/admin/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<EmailCampaign[]>({
    queryKey: ["/api/admin/campaigns"],
    enabled: auth?.authenticated === true,
  });

  const { data: allTags } = useQuery<string[]>({
    queryKey: ["/api/admin/tags"],
    enabled: auth?.authenticated === true,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: any = { subject, htmlBody, targetStatus };
      if (includeTags.length > 0) body.includeTags = includeTags;
      if (excludeTags.length > 0) body.excludeTags = excludeTags;
      if (scheduleType === "schedule" && scheduledAt) {
        body.scheduledAt = new Date(scheduledAt).toISOString();
      } else {
        body.scheduledAt = null;
      }
      return apiRequest("POST", "/api/admin/campaigns", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      setDialogOpen(false);
      setSubject("");
      setHtmlBody("");
      setTargetStatus("all");
      setScheduleType("now");
      setScheduledAt("");
      setIncludeTags([]);
      setExcludeTags([]);
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!auth?.authenticated) {
    setLocation("/admin");
    return null;
  }

  async function handleLogout() {
    await apiRequest("POST", "/api/admin/logout");
    queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
    setLocation("/admin");
  }

  function getTargetLabel(target: string) {
    switch (target) {
      case "all": return "All";
      case "quoted": return "Quoted";
      case "deposit_paid": return "Deposit Paid";
      case "completed": return "Completed";
      case "lead": return "Leads Only";
      default: return target;
    }
  }

  const SUGGESTED_TAGS = ["meta_lead", "calculator_lead", "deposit_paid", "completed"];
  const availableTags = Array.from(new Set([...SUGGESTED_TAGS, ...(allTags || [])])).sort();

  function addIncludeTag(tag: string) {
    const t = tag.toLowerCase().trim();
    if (t && !includeTags.includes(t)) setIncludeTags([...includeTags, t]);
    setNewIncludeTag("");
  }

  function addExcludeTag(tag: string) {
    const t = tag.toLowerCase().trim();
    if (t && !excludeTags.includes(t)) setExcludeTags([...excludeTags, t]);
    setNewExcludeTag("");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-lg font-semibold" style={{ color: "hsl(193 100% 45%)" }}>
            Doors On Demand Admin
          </h1>
          <div className="flex items-center gap-2">
            <Link href="/admin/pipeline">
              <Button variant="ghost" size="sm" data-testid="link-pipeline">Pipeline</Button>
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

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-xl font-semibold">Email Campaigns</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: "hsl(193 100% 45%)" }} data-testid="button-new-campaign">
                <Plus className="w-4 h-4 mr-1" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Campaign</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="campaign-subject">Subject Line</Label>
                  <Input
                    id="campaign-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject..."
                    required
                    data-testid="input-campaign-subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-body">
                    Body (HTML)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Variables: {"{{firstName}}"}, {"{{lastName}}"}, {"{{name}}"}
                  </p>
                  <Textarea
                    id="campaign-body"
                    value={htmlBody}
                    onChange={(e) => setHtmlBody(e.target.value)}
                    placeholder="<p>Hi {{firstName}},</p>"
                    rows={6}
                    required
                    data-testid="input-campaign-body"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Status</Label>
                  <Select value={targetStatus} onValueChange={setTargetStatus}>
                    <SelectTrigger data-testid="select-target">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      <SelectItem value="lead">Leads Only</SelectItem>
                      <SelectItem value="quoted">Quoted Only</SelectItem>
                      <SelectItem value="deposit_paid">Deposit Paid Only</SelectItem>
                      <SelectItem value="completed">Completed Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Include Tags (only send to leads with these tags)
                  </Label>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {includeTags.map(tag => (
                      <Badge key={tag} className="bg-green-100 text-green-800 border-green-200 gap-1 no-default-hover-elevate" data-testid={`badge-include-${tag}`}>
                        {tag}
                        <button type="button" onClick={() => setIncludeTags(includeTags.filter(t => t !== tag))} className="hover:text-green-600">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Select value="" onValueChange={(v) => addIncludeTag(v)}>
                      <SelectTrigger className="flex-1" data-testid="select-include-tag">
                        <SelectValue placeholder="Select tag..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTags.filter(t => !includeTags.includes(t)).map(tag => (
                          <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="w-32"
                      placeholder="Custom..."
                      value={newIncludeTag}
                      onChange={(e) => setNewIncludeTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); addIncludeTag(newIncludeTag); }
                      }}
                      data-testid="input-include-tag"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Leave empty to include all. If set, only recipients with at least one of these tags will receive the email.</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1 text-red-700">
                    <Tag className="w-3.5 h-3.5" />
                    Exclude Tags (skip leads with these tags)
                  </Label>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {excludeTags.map(tag => (
                      <Badge key={tag} className="bg-red-100 text-red-800 border-red-200 gap-1 no-default-hover-elevate" data-testid={`badge-exclude-${tag}`}>
                        {tag}
                        <button type="button" onClick={() => setExcludeTags(excludeTags.filter(t => t !== tag))} className="hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Select value="" onValueChange={(v) => addExcludeTag(v)}>
                      <SelectTrigger className="flex-1" data-testid="select-exclude-tag">
                        <SelectValue placeholder="Select tag..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTags.filter(t => !excludeTags.includes(t)).map(tag => (
                          <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="w-32"
                      placeholder="Custom..."
                      value={newExcludeTag}
                      onChange={(e) => setNewExcludeTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); addExcludeTag(newExcludeTag); }
                      }}
                      data-testid="input-exclude-tag"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Recipients with any of these tags will be skipped. Use "deposit_paid" or "completed" to avoid emailing converted customers.</p>
                </div>

                <div className="space-y-2">
                  <Label>Schedule</Label>
                  <Select value={scheduleType} onValueChange={(v) => setScheduleType(v as "now" | "schedule")}>
                    <SelectTrigger data-testid="select-schedule">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now">Send Now</SelectItem>
                      <SelectItem value="schedule">Schedule</SelectItem>
                    </SelectContent>
                  </Select>
                  {scheduleType === "schedule" && (
                    <Input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      required
                      data-testid="input-schedule-date"
                    />
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                  style={{ backgroundColor: "hsl(193 100% 45%)" }}
                  data-testid="button-send-campaign"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : scheduleType === "now" ? (
                    <>
                      <Send className="w-4 h-4 mr-1" />
                      Send Now
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-1" />
                      Schedule
                    </>
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campaign History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Subject</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Target</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Tags</th>
                    <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Scheduled/Sent</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Recipients</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignsLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                      </td>
                    </tr>
                  ) : !campaigns || campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">No campaigns yet</td>
                    </tr>
                  ) : (
                    campaigns.map((c) => (
                      <tr key={c.id} className="border-b" data-testid={`row-campaign-${c.id}`}>
                        <td className="p-3 font-medium">{c.subject}</td>
                        <td className="p-3">
                          <Badge variant="secondary" className="no-default-hover-elevate">{getTargetLabel(c.targetStatus)}</Badge>
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {(c.includeTags || []).map(t => (
                              <Badge key={`inc-${t}`} className="bg-green-50 text-green-700 border-green-200 text-xs no-default-hover-elevate">+{t}</Badge>
                            ))}
                            {(c.excludeTags || []).map(t => (
                              <Badge key={`exc-${t}`} className="bg-red-50 text-red-700 border-red-200 text-xs no-default-hover-elevate">-{t}</Badge>
                            ))}
                            {!(c.includeTags || []).length && !(c.excludeTags || []).length && (
                              <span className="text-muted-foreground text-xs">No filters</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground hidden sm:table-cell">
                          {c.sentAt
                            ? new Date(c.sentAt).toLocaleDateString("en-GB")
                            : c.scheduledAt
                              ? `Scheduled: ${new Date(c.scheduledAt).toLocaleDateString("en-GB")}`
                              : "Pending"}
                        </td>
                        <td className="p-3 text-right">{c.sentCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
