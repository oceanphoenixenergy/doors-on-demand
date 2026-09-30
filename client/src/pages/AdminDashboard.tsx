import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { DOOR_STYLES } from "@shared/schema";
import type { QuoteSubmission, EmailLog, EmailTemplate } from "@shared/schema";
import { Users, FileText, CreditCard, CheckCircle, MailX, LogOut, ChevronDown, ChevronUp, Search, Loader2, Mail, Send, Phone, MapPin, DoorOpen, PoundSterling, Calendar, Clock, Download, Trash2, TrendingUp, MessageCircle, Ruler, Home, ClipboardList, Pencil, Save, X, Tag, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const customerParam = new URLSearchParams(window.location.search).get("customer");
  const [expandedRow, setExpandedRow] = useState<string | null>(customerParam);

  const { data: auth, isLoading: authLoading } = useQuery<{ authenticated: boolean } | null>({
    queryKey: ["/api/admin/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: stats } = useQuery<{ total: number; leads: number; quoted: number; depositPaid: number; completed: number; unsubscribed: number; quotedTotal: number; depositPaidTotal: number; completedTotal: number; needsFollowUp: number; overdueFollowUps: number; dispositionCounts: Record<string, number> }>({
    queryKey: ["/api/admin/stats"],
    enabled: auth?.authenticated === true,
  });

  const { data: customers, isLoading: customersLoading } = useQuery<QuoteSubmission[]>({
    queryKey: [`/api/admin/customers?status=${statusFilter}`],
    enabled: auth?.authenticated === true,
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

  const filteredCustomers = (customers || []).filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  async function handleLogout() {
    await apiRequest("POST", "/api/admin/logout");
    queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
    setLocation("/admin");
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "quoted":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 no-default-hover-elevate" data-testid={`badge-status-${status}`}>Quoted</Badge>;
      case "deposit_paid":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 no-default-hover-elevate" data-testid={`badge-status-${status}`}>Deposit Paid</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200 no-default-hover-elevate" data-testid={`badge-status-${status}`}>Completed</Badge>;
      case "lead":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200 no-default-hover-elevate" data-testid={`badge-status-${status}`}>Lead</Badge>;
      default:
        return <Badge variant="secondary" data-testid={`badge-status-${status}`}>{status}</Badge>;
    }
  }

  function getDoorStyleName(key: string) {
    const style = DOOR_STYLES[key as keyof typeof DOOR_STYLES];
    return style?.name || key;
  }

  const statCards = [
    { label: "Total Customers", value: stats?.total ?? 0, icon: Users, color: "hsl(193 100% 45%)", filterValue: "all" },
    { label: "Quoted", value: stats?.quoted ?? 0, icon: FileText, color: "hsl(45 93% 47%)", filterValue: "quoted" },
    { label: "Deposit Paid", value: stats?.depositPaid ?? 0, icon: CreditCard, color: "hsl(217 91% 60%)", filterValue: "deposit_paid" },
    { label: "Completed", value: stats?.completed ?? 0, icon: CheckCircle, color: "hsl(142 71% 45%)", filterValue: "completed" },
    { label: "Unsubscribed", value: stats?.unsubscribed ?? 0, icon: MailX, color: "hsl(0 72% 51%)", filterValue: "unsubscribed" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-lg font-semibold" data-testid="text-admin-title" style={{ color: "hsl(193 100% 45%)" }}>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((s) => (
            <Card
              key={s.label}
              data-testid={`card-stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={`cursor-pointer transition-shadow hover-elevate ${statusFilter === s.filterValue ? "ring-2" : ""}`}
              style={statusFilter === s.filterValue ? { boxShadow: `0 0 0 2px ${s.color}` } : undefined}
              onClick={() => setStatusFilter(s.filterValue)}
            >
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card data-testid="card-revenue-quoted">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Opportunity Pipeline</CardTitle>
              <FileText className="w-4 h-4" style={{ color: "hsl(45 93% 47%)" }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: "hsl(45 93% 47%)" }}>&pound;{(stats?.quotedTotal ?? 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats?.quoted ?? 0} quotes outstanding</p>
            </CardContent>
          </Card>
          <Card data-testid="card-revenue-deposits">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Deposits Received</CardTitle>
              <CreditCard className="w-4 h-4" style={{ color: "hsl(217 91% 60%)" }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: "hsl(217 91% 60%)" }}>&pound;{(stats?.depositPaidTotal ?? 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats?.depositPaid ?? 0} jobs awaiting fitting</p>
            </CardContent>
          </Card>
          <Card data-testid="card-revenue-completed">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed Revenue</CardTitle>
              <TrendingUp className="w-4 h-4" style={{ color: "hsl(142 71% 45%)" }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: "hsl(142 71% 45%)" }}>&pound;{(stats?.completedTotal ?? 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats?.completed ?? 0} jobs completed</p>
            </CardContent>
          </Card>
        </div>

        {((stats?.needsFollowUp ?? 0) > 0 || (stats?.overdueFollowUps ?? 0) > 0 || Object.keys(stats?.dispositionCounts ?? {}).length > 0) && (
          <Card data-testid="card-disposition-summary">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4" /> Follow-up Summary
              </CardTitle>
              <div className="flex items-center gap-3 flex-wrap">
                {(stats?.needsFollowUp ?? 0) > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 no-default-hover-elevate" data-testid="badge-needs-followup-count">
                    {stats?.needsFollowUp} need follow-up
                  </Badge>
                )}
                {(stats?.overdueFollowUps ?? 0) > 0 && (
                  <Badge className="bg-red-100 text-red-800 border-red-200 no-default-hover-elevate" data-testid="badge-overdue-count">
                    {stats?.overdueFollowUps} overdue
                  </Badge>
                )}
              </div>
            </CardHeader>
            {Object.keys(stats?.dispositionCounts ?? {}).length > 0 && (
              <CardContent>
                <div className="flex items-center gap-3 flex-wrap">
                  {Object.entries(stats?.dispositionCounts ?? {}).map(([key, count]) => (
                    <div key={key} className="flex items-center gap-1.5 text-sm">
                      <span className="text-muted-foreground">{key.replace(/_/g, ' ')}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
              <TabsList>
                <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
                <TabsTrigger value="lead" data-testid="tab-lead">Leads</TabsTrigger>
                <TabsTrigger value="quoted" data-testid="tab-quoted">Quoted</TabsTrigger>
                <TabsTrigger value="deposit_paid" data-testid="tab-deposit-paid">Deposit Paid</TabsTrigger>
                <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
                <TabsTrigger value="unsubscribed" data-testid="tab-unsubscribed">Unsubscribed</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <Button
                variant="outline"
                size="default"
                onClick={() => window.open("/api/admin/customers/export-csv", "_blank")}
                data-testid="button-export-csv"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Export
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                      <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                      <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Mobile</th>
                      <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Door Style</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Quote Total</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                      <th className="text-center p-3 font-medium text-muted-foreground hidden md:table-cell">Unsub</th>
                      <th className="p-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {customersLoading ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-muted-foreground">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-muted-foreground">No customers found</td>
                      </tr>
                    ) : (
                      filteredCustomers.map((c) => (
                        <CustomerRow
                          key={c.id}
                          customer={c}
                          expanded={expandedRow === c.id}
                          onToggle={() => setExpandedRow(expandedRow === c.id ? null : c.id)}
                          getStatusBadge={getStatusBadge}
                          getDoorStyleName={getDoorStyleName}
                          statusFilter={statusFilter}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function CustomerRow({
  customer,
  expanded,
  onToggle,
  getStatusBadge,
  getDoorStyleName,
  statusFilter,
}: {
  customer: QuoteSubmission;
  expanded: boolean;
  onToggle: () => void;
  getStatusBadge: (status: string) => JSX.Element;
  getDoorStyleName: (key: string) => string;
  statusFilter: string;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [sendingTemplate, setSendingTemplate] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [discountInput, setDiscountInput] = useState(customer.discountPercent?.toString() || "0");
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [togglingUnsub, setTogglingUnsub] = useState(false);
  const [localUnsub, setLocalUnsub] = useState(customer.unsubscribed);
  const [deleting, setDeleting] = useState(false);
  const [localDisposition, setLocalDisposition] = useState(customer.dispositionStatus || "none");
  const [localDispositionNotes, setLocalDispositionNotes] = useState(customer.dispositionNotes || "");
  const [localFollowUpDate, setLocalFollowUpDate] = useState(customer.followUpDate ? new Date(customer.followUpDate).toISOString().split('T')[0] : "");
  const [savingDisposition, setSavingDisposition] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingQuote, setEditingQuote] = useState(false);
  const [editTotalDoors, setEditTotalDoors] = useState(customer.totalDoors.toString());
  const [editFireDoors, setEditFireDoors] = useState(customer.fireDoors.toString());
  const [editGlazedDoors, setEditGlazedDoors] = useState(customer.glazedDoors.toString());
  const [editBathroomLocks, setEditBathroomLocks] = useState(customer.bathroomLocks.toString());
  const [editGrandTotal, setEditGrandTotal] = useState(customer.grandTotal.toString());
  const [editDepositDue, setEditDepositDue] = useState(customer.depositDue.toString());
  const [savingQuoteEdit, setSavingQuoteEdit] = useState(false);
  const [quoteEditSaved, setQuoteEditSaved] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [generatingTopup, setGeneratingTopup] = useState(false);
  const [topupLink, setTopupLink] = useState<string | null>(null);
  const [topupError, setTopupError] = useState<string | null>(null);
  const [topupCopied, setTopupCopied] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [addingTag, setAddingTag] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiRequest("DELETE", `/api/admin/customers/${customer.id}`);
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0] as string;
        return typeof key === "string" && (key.startsWith("/api/admin/customers") || key === "/api/admin/stats");
      }});
    } catch (err) {
      console.error(err);
    }
    setDeleting(false);
  }

  const { data: emails, isLoading: emailsLoading } = useQuery<EmailLog[]>({
    queryKey: ["/api/admin/customers", customer.id, "emails"],
    enabled: expanded,
  });

  const { data: templates } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/email-templates"],
    enabled: expanded,
  });

  async function handleSendTemplate() {
    if (!selectedTemplate) return;
    setSendingTemplate(true);
    setSendSuccess(null);
    setSendError(null);
    try {
      await apiRequest("POST", `/api/admin/customers/${customer.id}/send-template`, { templateKey: selectedTemplate });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/customers", customer.id, "emails"] });
      const tmpl = templates?.find(t => t.templateKey === selectedTemplate);
      setSendSuccess(`"${tmpl?.name || selectedTemplate}" sent`);
      setSelectedTemplate("");
      setTimeout(() => setSendSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      setSendError("Failed to send email. Please try again.");
      setTimeout(() => setSendError(null), 5000);
    }
    setSendingTemplate(false);
  }

  async function handleStatusChange(newStatus: string) {
    setUpdatingStatus(true);
    try {
      await apiRequest("PATCH", `/api/admin/customers/${customer.id}/status`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/customers?status=${statusFilter}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    } catch (err) {
      console.error(err);
    }
    setUpdatingStatus(false);
  }

  async function handleToggleUnsub() {
    const newVal = !localUnsub;
    setLocalUnsub(newVal);
    setTogglingUnsub(true);
    try {
      await apiRequest("PATCH", `/api/admin/customers/${customer.id}/unsubscribe`, { unsubscribed: newVal });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/customers?status=${statusFilter}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    } catch (err) {
      console.error(err);
      setLocalUnsub(!newVal);
    }
    setTogglingUnsub(false);
  }

  const finishLabel = customer.doorFinish === "prefinished" ? "Pre-finished" : "Unfinished";

  return (
    <>
      <tr
        className="border-b hover-elevate cursor-pointer"
        onClick={onToggle}
        data-testid={`row-customer-${customer.id}`}
      >
        <td className="p-3 font-medium">
          <span className="flex items-center gap-1.5 flex-wrap">
            {!customer.dispositionStatus && !customer.whatsappFollowedUp && (customer.status === "quoted" || customer.status === "lead") && (
              <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="Needs follow-up" data-testid={`indicator-needs-followup-${customer.id}`} />
            )}
            {customer.firstName} {customer.lastName}
            {customer.leadSource === "meta" && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1 py-0 no-default-hover-elevate" data-testid={`badge-source-meta-${customer.id}`}>
                Meta
              </Badge>
            )}
            {customer.whatsappFollowedUp && (
              <MessageCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" data-testid={`icon-wa-done-${customer.id}`} />
            )}
            {customer.dispositionStatus && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 no-default-hover-elevate" data-testid={`badge-disposition-${customer.id}`}>
                {customer.dispositionStatus.replace(/_/g, ' ')}
              </Badge>
            )}
            {customer.followUpDate && new Date(customer.followUpDate) <= new Date() && !customer.dispositionStatus?.match(/^(too_expensive|competitor|changed_mind|booked_elsewhere|wrong_number)$/) && (
              <Badge className="bg-red-100 text-red-800 border-red-200 text-[10px] px-1 py-0 no-default-hover-elevate" data-testid={`badge-overdue-${customer.id}`}>
                Follow up overdue
              </Badge>
            )}
          </span>
        </td>
        <td className="p-3 text-muted-foreground hidden md:table-cell">{customer.email}</td>
        <td className="p-3 text-muted-foreground hidden lg:table-cell">{customer.mobile}</td>
        <td className="p-3 hidden sm:table-cell">{getDoorStyleName(customer.doorStyle)}</td>
        <td className="p-3 text-right font-medium">&pound;{customer.grandTotal.toLocaleString()}</td>
        <td className="p-3">{getStatusBadge(customer.status)}</td>
        <td className="p-3 text-muted-foreground hidden lg:table-cell">
          {new Date(customer.timestamp).toLocaleDateString("en-GB")}
        </td>
        <td className="p-3 text-center hidden md:table-cell">
          {customer.unsubscribed ? (
            <span className="text-destructive text-xs">Yes</span>
          ) : (
            <span className="text-muted-foreground text-xs">No</span>
          )}
        </td>
        <td className="p-3">
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={9} className="bg-muted/30 p-0">
            <div className="p-4 md:p-6 space-y-5" onClick={(e) => e.stopPropagation()}>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <Users className="w-4 h-4" /> Contact Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[60px]">Name</span>
                      <span data-testid={`text-name-${customer.id}`}>{customer.firstName} {customer.lastName}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[60px]">Email</span>
                      <a href={`mailto:${customer.email}`} className="text-blue-600 underline break-all" data-testid={`link-email-${customer.id}`}>{customer.email}</a>
                    </div>
                    <div className="flex items-start gap-2 flex-wrap">
                      <Phone className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <a href={`tel:${customer.mobile}`} className="text-blue-600 underline" data-testid={`link-mobile-${customer.id}`}>{customer.mobile}</a>
                      {customer.leadSource === "meta" && !customer.grandTotal ? (
                        <a
                          href={`https://wa.me/${customer.mobile.replace(/\D/g, '').replace(/^0/, '44')}?text=${encodeURIComponent(`Hi ${customer.firstName || 'there'}, it's Mark from Doors On Demand!\n\nI can see you were looking at getting some internal doors sorted — brilliant 👋\n\nHave you got a rough idea of how many doors you're looking at? Even just a ballpark helps and I can let you know what's involved.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`link-whatsapp-lead-${customer.id}`}
                          title="Send opening message to Meta lead"
                        >
                          <MessageCircle className="w-4 h-4 text-blue-500" />
                        </a>
                      ) : (
                        <>
                          <a
                            href={`https://wa.me/${customer.mobile.replace(/\D/g, '').replace(/^0/, '44')}?text=${encodeURIComponent(`Hi ${customer.firstName || 'there'}, it's Mark from Doors On Demand.\n\nJust wanted to check you received your quote okay and see if you had any questions about it?`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid={`link-whatsapp-${customer.id}`}
                            title="Send quote follow-up message"
                          >
                            <MessageCircle className="w-4 h-4 text-green-600" />
                          </a>
                          <a
                            href={`https://wa.me/${customer.mobile.replace(/\D/g, '').replace(/^0/, '44')}?text=${encodeURIComponent(`Hi ${customer.firstName || 'there'}, just a quick follow-up from my message the other day.\n\nIs there anything about the quote you'd like to go over? Even if it's just a quick question — I'm happy to help 😊`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid={`link-whatsapp-followup2-${customer.id}`}
                            title="Send secondary follow-up message"
                          >
                            <MessageCircle className="w-4 h-4 text-amber-500" />
                          </a>
                        </>
                      )}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const newValue = !customer.whatsappFollowedUp;
                          await apiRequest("PATCH", `/api/admin/customers/${customer.id}/whatsapp-followed-up`, { whatsappFollowedUp: newValue });
                          queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0] as string)?.startsWith('/api/admin/customers') });
                        }}
                        className={`ml-1 text-xs px-2 py-0.5 rounded-md border ${customer.whatsappFollowedUp ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700' : 'bg-muted text-muted-foreground border-border'}`}
                        data-testid={`button-wa-toggle-${customer.id}`}
                        title={customer.whatsappFollowedUp ? "Mark as not followed up" : "Mark as followed up via WhatsApp"}
                      >
                        {customer.whatsappFollowedUp ? "Followed up" : "Mark followed up"}
                      </button>
                    </div>
                    <div className="flex items-start gap-2">
                      <Home className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div data-testid={`text-address-${customer.id}`}>
                        {customer.addressLine1 && <div>{customer.addressLine1}</div>}
                        {customer.addressLine2 && <div>{customer.addressLine2}</div>}
                        {customer.city && <div>{customer.city}</div>}
                        <div>{customer.postcode}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <DoorOpen className="w-4 h-4" /> Door Configuration
                    </CardTitle>
                    <Button
                      size="icon"
                      variant="ghost"
                      data-testid={`button-edit-quote-${customer.id}`}
                      onClick={(e) => { e.stopPropagation(); setEditingQuote(!editingQuote); setQuoteEditSaved(false); }}
                    >
                      {editingQuote ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {editingQuote ? (
                      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground">Total Doors</label>
                          <Input
                            type="number"
                            min="0"
                            value={editTotalDoors}
                            onChange={(e) => setEditTotalDoors(e.target.value)}
                            data-testid={`input-edit-totaldoors-${customer.id}`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground">Fire Doors</label>
                          <Input
                            type="number"
                            min="0"
                            value={editFireDoors}
                            onChange={(e) => setEditFireDoors(e.target.value)}
                            data-testid={`input-edit-firedoors-${customer.id}`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground">Glazed Doors</label>
                          <Input
                            type="number"
                            min="0"
                            value={editGlazedDoors}
                            onChange={(e) => setEditGlazedDoors(e.target.value)}
                            data-testid={`input-edit-glazeddoors-${customer.id}`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground">Bathroom Locks</label>
                          <Input
                            type="number"
                            min="0"
                            value={editBathroomLocks}
                            onChange={(e) => setEditBathroomLocks(e.target.value)}
                            data-testid={`input-edit-bathroomlocks-${customer.id}`}
                          />
                        </div>
                        <Separator />
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground">Grand Total (&pound;)</label>
                          <Input
                            type="number"
                            min="0"
                            value={editGrandTotal}
                            onChange={(e) => {
                              setEditGrandTotal(e.target.value);
                            }}
                            data-testid={`input-edit-grandtotal-${customer.id}`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground">Deposit Due (&pound;)</label>
                          <Input
                            type="number"
                            min="0"
                            value={editDepositDue}
                            onChange={(e) => setEditDepositDue(e.target.value)}
                            data-testid={`input-edit-depositdue-${customer.id}`}
                          />
                          {editGrandTotal && editDepositDue && parseInt(editGrandTotal) > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Balance: &pound;{Math.max(0, parseInt(editGrandTotal) - (parseInt(editDepositDue) || 0)).toLocaleString()}
                            </div>
                          )}
                        </div>
                        <Button
                          className="w-full"
                          disabled={savingQuoteEdit}
                          data-testid={`button-save-quote-edit-${customer.id}`}
                          onClick={async (e) => {
                            e.stopPropagation();
                            setSavingQuoteEdit(true);
                            try {
                              const total = parseInt(editGrandTotal) || 0;
                              const parsedDeposit = parseInt(editDepositDue);
                              const deposit = isNaN(parsedDeposit) ? Math.ceil(total / 2) : parsedDeposit;
                              await apiRequest("PATCH", `/api/admin/customers/${customer.id}/edit-quote`, {
                                totalDoors: parseInt(editTotalDoors) || 0,
                                fireDoors: parseInt(editFireDoors) || 0,
                                glazedDoors: parseInt(editGlazedDoors) || 0,
                                bathroomLocks: parseInt(editBathroomLocks) || 0,
                                grandTotal: total,
                                depositDue: deposit,
                              });
                              await queryClient.invalidateQueries({ predicate: (query) => {
                                const key = query.queryKey[0] as string;
                                return typeof key === "string" && (key.startsWith("/api/admin/customers") || key === "/api/admin/stats");
                              }});
                              setQuoteEditSaved(true);
                              setTimeout(() => { setEditingQuote(false); setQuoteEditSaved(false); }, 1500);
                            } catch (err) {
                              console.error("Failed to edit quote:", err);
                            } finally {
                              setSavingQuoteEdit(false);
                            }
                          }}
                        >
                          {savingQuoteEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : quoteEditSaved ? "Saved" : <><Save className="w-4 h-4 mr-1.5" /> Save Changes</>}
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">Style</span>
                          <span className="font-medium" data-testid={`text-doorstyle-${customer.id}`}>{getDoorStyleName(customer.doorStyle)} ({finishLabel})</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">Total Doors</span>
                          <span className="font-medium" data-testid={`text-totaldoors-${customer.id}`}>{customer.totalDoors}</span>
                        </div>
                        {customer.fireDoors > 0 && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">Fire Doors</span>
                            <span className="font-medium">{customer.fireDoors}</span>
                          </div>
                        )}
                        {customer.glazedDoors > 0 && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">Glazed Doors</span>
                            <span className="font-medium">{customer.glazedDoors}{customer.glazedStyle ? ` (${customer.glazedStyle})` : ''}</span>
                          </div>
                        )}
                        {customer.bathroomLocks > 0 && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">Bathroom Locks</span>
                            <span className="font-medium">{customer.bathroomLocks}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">Handles</span>
                          <span className="font-medium">{customer.handleModel} - {customer.handleFinish}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <PoundSterling className="w-4 h-4" /> Pricing & Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {customer.originalGrandTotal && customer.discountPercent > 0 && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Original Total</span>
                        <span className="text-muted-foreground line-through">&pound;{customer.originalGrandTotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Grand Total</span>
                      <span className="font-bold text-base" data-testid={`text-total-${customer.id}`}>
                        &pound;{customer.grandTotal.toLocaleString()}
                        {customer.discountPercent > 0 && (
                          <Badge variant="secondary" className="ml-1.5 text-xs">{customer.discountPercent}% off</Badge>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Deposit (50%)</span>
                      <span className="font-medium">&pound;{customer.depositDue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Balance</span>
                      <span className="font-medium">&pound;{(customer.grandTotal - customer.depositDue).toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="space-y-1.5">
                      <span className="text-muted-foreground text-xs">Apply Discount</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="50"
                          step="1"
                          value={discountInput}
                          onChange={(e) => setDiscountInput(e.target.value)}
                          className="w-20 text-sm"
                          data-testid={`input-discount-${customer.id}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={applyingDiscount || !discountInput || isNaN(parseFloat(discountInput)) || parseFloat(discountInput) === (customer.discountPercent || 0)}
                          data-testid={`button-apply-discount-${customer.id}`}
                          onClick={async (e) => {
                            e.stopPropagation();
                            const val = parseFloat(discountInput);
                            if (isNaN(val) || val < 0 || val > 50) return;
                            setApplyingDiscount(true);
                            try {
                              await apiRequest("PATCH", `/api/admin/customers/${customer.id}/discount`, { discountPercent: val });
                              queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0] as string)?.startsWith('/api/admin/customers') });
                              queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
                            } catch (err) {
                              console.error("Failed to apply discount:", err);
                            } finally {
                              setApplyingDiscount(false);
                            }
                          }}
                        >
                          {applyingDiscount ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
                        </Button>
                        {customer.discountPercent > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            data-testid={`button-remove-discount-${customer.id}`}
                            onClick={async (e) => {
                              e.stopPropagation();
                              setApplyingDiscount(true);
                              try {
                                await apiRequest("PATCH", `/api/admin/customers/${customer.id}/discount`, { discountPercent: 0 });
                                setDiscountInput("0");
                                queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0] as string)?.startsWith('/api/admin/customers') });
                                queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
                              } catch (err) {
                                console.error("Failed to remove discount:", err);
                              } finally {
                                setApplyingDiscount(false);
                              }
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      {customer.discountPercent > 0 && (() => {
                        const savings = customer.originalGrandTotal ? customer.originalGrandTotal - customer.grandTotal : 0;
                        const discountedDeposit = Math.ceil(customer.grandTotal / 2);
                        const resumeUrl = customer.resumeToken ? `${window.location.origin}/resume/${customer.resumeToken}` : '';
                        const waMsg = `Hi ${customer.firstName || 'there'}, it's Mark from Doors On Demand.\n\nGreat news! I've applied a ${customer.discountPercent}% discount to your quote.\n\n` +
                          (customer.originalGrandTotal ? `Was: \u00A3${customer.originalGrandTotal.toLocaleString()}\nNow: \u00A3${customer.grandTotal.toLocaleString()}\nYou save: \u00A3${savings.toLocaleString()}\nDeposit: just \u00A3${discountedDeposit.toLocaleString()}\n\n` : '') +
                          (resumeUrl ? `You can book in here \u2014 takes about 30 seconds:\n${resumeUrl}\n\n` : '') +
                          `Let me know if you have any questions!`;
                        const waPhone = customer.mobile.replace(/\D/g, '').replace(/^0/, '44');
                        return (
                          <a
                            href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid={`link-whatsapp-discount-${customer.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button size="sm" variant="outline" className="w-full mt-1.5 text-green-700 border-green-300 dark:text-green-400 dark:border-green-700" onClick={(e) => e.stopPropagation()}>
                              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                              Send Discount via WhatsApp
                            </Button>
                          </a>
                        );
                      })()}
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Status</span>
                      {getStatusBadge(customer.status)}
                    </div>
                    {customer.preferredTiming && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Fitting Date</span>
                        <span className="font-medium flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {customer.preferredTiming}
                        </span>
                      </div>
                    )}
                    {customer.status === 'deposit_paid' && (() => {
                      const doorSizesRaw = customer.notes?.startsWith("Door sizes:") ? customer.notes.replace("Door sizes: ", "").split(/(,\s*(?=[A-Z]))|(\.\s*)/).filter(Boolean).map(s => s.trim().replace(/^,\s*/, '').replace(/^\.\s*/, '')).filter(s => s && s !== ',').join('\n') : '';
                      const fittingInfo = customer.preferredTiming || '';
                      const waMsg = `Hi ${customer.firstName || 'there'}, it's Mark from Doors On Demand.\n\nThank you so much for your order! Really appreciate you choosing us.\n\n` +
                        (doorSizesRaw ? `Just wanted to quickly confirm you're happy with the door sizes you've given:\n${doorSizesRaw}\n\nIf anything needs changing, just let me know now before I place the order.\n\n` : '') +
                        (fittingInfo ? `Your fitting date${fittingInfo.includes('Day') ? 's are' : ' is'} secured: ${fittingInfo}\n\n` : '') +
                        `The doors and all hardware will be ordered shortly.\n\nIf you have any questions at all, just drop me a message. Looking forward to transforming your home!`;
                      const waPhone = customer.mobile.replace(/\D/g, '').replace(/^0/, '44');
                      return (
                        <a
                          href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`link-whatsapp-deposit-${customer.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button size="sm" variant="outline" className="w-full mt-1 text-green-700 border-green-300 dark:text-green-400 dark:border-green-700" onClick={(e) => e.stopPropagation()}>
                            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                            Send Thank You via WhatsApp
                          </Button>
                        </a>
                      );
                    })()}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Quote Date</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(customer.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Funnel progress</span>
                      {customer.leadSource === "meta" && !customer.wizardStep ? (
                        <Badge variant="secondary" className="text-xs no-default-hover-elevate" data-testid={`badge-wizardstep-${customer.id}`}>
                          Meta lead (no wizard)
                        </Badge>
                      ) : customer.wizardStep ? (
                        <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200 text-xs no-default-hover-elevate" data-testid={`badge-wizardstep-${customer.id}`}>
                          Reached: {customer.wizardStep}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs" data-testid={`badge-wizardstep-${customer.id}`}>—</span>
                      )}
                    </div>
                    {customer.notes && (
                      <>
                        <Separator />
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground text-xs font-medium">Door Sizes</span>
                          </div>
                          {customer.notes.startsWith("Door sizes:") ? (
                            <div className="space-y-1">
                              {customer.notes.replace("Door sizes: ", "").split(/(,\s*(?=[A-Z]))|(\.\s*)/).filter(Boolean).map((size, i) => {
                                const trimmed = size.trim().replace(/^,\s*/, '').replace(/^\.\s*/, '');
                                if (!trimmed || trimmed === ',') return null;
                                return (
                                  <div key={i} className="text-sm" data-testid={`text-doorsize-${customer.id}-${i}`}>
                                    {trimmed}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm mt-1">{customer.notes}</p>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                      <Send className="w-4 h-4" /> Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground font-medium">Send Email</label>
                      <div className="flex items-center gap-2">
                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                          <SelectTrigger className="flex-1" data-testid={`select-template-${customer.id}`}>
                            <SelectValue placeholder="Choose a template..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(templates || []).map((t) => (
                              <SelectItem key={t.templateKey} value={t.templateKey} data-testid={`option-template-${t.templateKey}`}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="default"
                          disabled={!selectedTemplate || sendingTemplate}
                          onClick={handleSendTemplate}
                          data-testid={`button-send-template-${customer.id}`}
                        >
                          {sendingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                      </div>
                      {sendSuccess && (
                        <p className="text-xs text-green-600" data-testid={`text-send-success-${customer.id}`}>{sendSuccess}</p>
                      )}
                      {sendError && (
                        <p className="text-xs text-destructive" data-testid={`text-send-error-${customer.id}`}>{sendError}</p>
                      )}
                    </div>

                    {customer.resumeToken && customer.status !== 'deposit_paid' && customer.status !== 'completed' && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <label className="text-sm text-muted-foreground font-medium">Send Booking Link</label>
                          {(() => {
                            const resumeUrl = `${window.location.origin}/resume/${customer.resumeToken}`;
                            const deposit = Math.ceil(customer.grandTotal / 2);
                            const waMsg = `Hi ${customer.firstName || 'there'}, it's Mark from Doors On Demand.\n\n` +
                              (customer.grandTotal > 0 ? `Your quote for ${customer.totalDoors} ${getDoorStyleName(customer.doorStyle)} doors is \u00A3${customer.grandTotal.toLocaleString()} (deposit: \u00A3${deposit.toLocaleString()}).\n\n` : '') +
                              `You can pick your fitting date and pay the deposit here \u2014 takes about 30 seconds:\n${resumeUrl}\n\n` +
                              `Let me know if you have any questions!`;
                            const waPhone = customer.mobile.replace(/\D/g, '').replace(/^0/, '44');
                            return (
                              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                <a
                                  href={`https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  data-testid={`link-whatsapp-resume-${customer.id}`}
                                >
                                  <Button size="sm" variant="outline" className="w-full text-green-700 border-green-300 dark:text-green-400 dark:border-green-700">
                                    <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                                    Send Booking Link via WhatsApp
                                  </Button>
                                </a>
                                <div className="flex items-center gap-1.5">
                                  <Input
                                    readOnly
                                    value={resumeUrl}
                                    className="text-xs flex-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      (e.target as HTMLInputElement).select();
                                      navigator.clipboard.writeText(resumeUrl);
                                    }}
                                    data-testid={`input-resume-url-${customer.id}`}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    data-testid={`button-copy-resume-${customer.id}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(resumeUrl);
                                    }}
                                  >
                                    Copy
                                  </Button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      <label className="text-sm text-muted-foreground font-medium">Create Top-up Payment Link</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">&pound;</span>
                        <Input
                          type="number"
                          min="1"
                          step="0.01"
                          placeholder="Amount"
                          value={topupAmount}
                          onChange={(e) => { setTopupAmount(e.target.value); setTopupLink(null); setTopupError(null); }}
                          className="flex-1"
                          data-testid={`input-topup-amount-${customer.id}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={generatingTopup || !topupAmount || parseFloat(topupAmount) <= 0}
                          data-testid={`button-generate-topup-${customer.id}`}
                          onClick={async (e) => {
                            e.stopPropagation();
                            const amt = parseFloat(topupAmount);
                            if (!amt || amt <= 0) return;
                            setGeneratingTopup(true);
                            setTopupLink(null);
                            setTopupError(null);
                            try {
                              const res = await apiRequest("POST", "/api/admin/create-custom-payment-link", {
                                customerId: customer.id,
                                amountPence: Math.round(amt * 100),
                              });
                              const result: { url: string } = await res.json();
                              setTopupLink(result.url);
                            } catch (err) {
                              console.error("Failed to generate top-up link:", err);
                              setTopupError("Failed to generate link. Please try again.");
                            } finally {
                              setGeneratingTopup(false);
                            }
                          }}
                        >
                          {generatingTopup ? <Loader2 className="w-3 h-3 animate-spin" /> : "Generate"}
                        </Button>
                      </div>
                      {topupError && (
                        <p className="text-xs text-destructive" data-testid={`text-topup-error-${customer.id}`}>{topupError}</p>
                      )}
                      {topupLink && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Input
                              readOnly
                              value={topupLink}
                              className="text-xs flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                (e.target as HTMLInputElement).select();
                                navigator.clipboard.writeText(topupLink);
                              }}
                              data-testid={`input-topup-url-${customer.id}`}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`button-copy-topup-${customer.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(topupLink);
                                setTopupCopied(true);
                                setTimeout(() => setTopupCopied(false), 2000);
                              }}
                            >
                              {topupCopied ? "Copied!" : "Copy"}
                            </Button>
                            <a
                              href={topupLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-testid={`link-open-topup-${customer.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button size="sm" variant="outline">Open</Button>
                            </a>
                          </div>
                          <a
                            href={`https://wa.me/${customer.mobile.replace(/\D/g, '').replace(/^0/, '44')}?text=${encodeURIComponent(`Hi ${customer.firstName || 'there'}, it's Mark from Doors On Demand.\n\nTo complete your deposit, please use this payment link:\n${topupLink}\n\nLet me know if you have any questions!`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid={`link-whatsapp-topup-${customer.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button size="sm" variant="outline" className="w-full text-green-700 border-green-300 dark:text-green-400 dark:border-green-700">
                              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                              Send via WhatsApp
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground font-medium">Update Status</label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {["quoted", "deposit_paid", "completed"].map((s) => (
                          <Button
                            key={s}
                            size="sm"
                            variant={customer.status === s ? "default" : "outline"}
                            disabled={customer.status === s || updatingStatus}
                            onClick={() => handleStatusChange(s)}
                            data-testid={`button-status-${s}-${customer.id}`}
                          >
                            {updatingStatus ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                            {s === "quoted" ? "Quoted" : s === "deposit_paid" ? "Deposit Paid" : "Completed"}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <label className="text-sm font-medium">Unsubscribed</label>
                        <p className="text-xs text-muted-foreground">Stop automated emails</p>
                      </div>
                      <Switch
                        checked={localUnsub}
                        onCheckedChange={handleToggleUnsub}
                        disabled={togglingUnsub}
                        data-testid={`switch-unsub-${customer.id}`}
                      />
                    </div>

                    <Separator />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full text-destructive border-destructive/30" data-testid={`button-delete-${customer.id}`}>
                          {deleting ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Trash2 className="w-3 h-3 mr-1.5" />}
                          Delete Customer
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {customer.firstName} {customer.lastName}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove this customer and all their quote data. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground" data-testid="button-confirm-delete">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4" /> Customer Outcome
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground font-medium">Outcome</label>
                      <Select 
                        value={localDisposition} 
                        onValueChange={(v) => setLocalDisposition(v)}
                      >
                        <SelectTrigger data-testid={`select-disposition-${customer.id}`}>
                          <SelectValue placeholder="Select outcome..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No outcome set</SelectItem>
                          <SelectItem value="too_expensive">Too Expensive</SelectItem>
                          <SelectItem value="not_ready">Not Ready Yet</SelectItem>
                          <SelectItem value="competitor">Went With Competitor</SelectItem>
                          <SelectItem value="no_response">No Response</SelectItem>
                          <SelectItem value="changed_mind">Changed Mind</SelectItem>
                          <SelectItem value="booked_elsewhere">Booked Elsewhere</SelectItem>
                          <SelectItem value="wrong_number">Wrong Number</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground font-medium">Notes</label>
                      <Textarea
                        placeholder="Add notes from your call or conversation..."
                        value={localDispositionNotes}
                        onChange={(e) => setLocalDispositionNotes(e.target.value)}
                        className="resize-none text-sm"
                        rows={3}
                        data-testid={`textarea-disposition-notes-${customer.id}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground font-medium">Follow Up Date</label>
                      <Input
                        type="date"
                        value={localFollowUpDate}
                        onChange={(e) => setLocalFollowUpDate(e.target.value)}
                        data-testid={`input-followup-date-${customer.id}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <Button
                      size="sm"
                      className="w-full"
                      disabled={savingDisposition}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setSavingDisposition(true);
                        try {
                          await apiRequest("PATCH", `/api/admin/customers/${customer.id}/disposition`, {
                            dispositionStatus: localDisposition === "none" ? null : localDisposition,
                            dispositionNotes: localDispositionNotes || null,
                            followUpDate: localFollowUpDate || null,
                          });
                          queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0] as string)?.startsWith('/api/admin/customers') });
                          queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
                          setSaveSuccess(true);
                          setTimeout(() => setSaveSuccess(false), 2000);
                        } catch (err) {
                          console.error("Failed to save disposition:", err);
                        }
                        setSavingDisposition(false);
                      }}
                      data-testid={`button-save-disposition-${customer.id}`}
                    >
                      {savingDisposition ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : saveSuccess ? <CheckCircle className="w-3 h-3 mr-1.5" /> : null}
                      {saveSuccess ? "Saved" : "Save Outcome"}
                    </Button>

                    {customer.dispositionDate && (
                      <p className="text-xs text-muted-foreground">
                        Last updated: {new Date(customer.dispositionDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                      <Tag className="w-4 h-4" /> Tags & Source
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Source:</span>
                      <Badge variant="secondary" className="no-default-hover-elevate" data-testid={`badge-lead-source-${customer.id}`}>
                        {customer.leadSource === "meta" ? "Meta (Facebook)" : customer.leadSource === "calculator" ? "Quote Calculator" : customer.leadSource || "calculator"}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex flex-wrap gap-1.5">
                      {(customer.tags || []).length === 0 && (
                        <span className="text-xs text-muted-foreground">No tags</span>
                      )}
                      {(customer.tags || []).map((tag: string) => (
                        <Badge key={tag} className="bg-cyan-50 text-cyan-700 border-cyan-200 gap-1 no-default-hover-elevate" data-testid={`badge-tag-${customer.id}-${tag}`}>
                          {tag}
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await apiRequest("DELETE", `/api/admin/customers/${customer.id}/tags/${encodeURIComponent(tag)}`);
                                queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0] as string)?.startsWith('/api/admin/customers') });
                              } catch (err) {
                                console.error("Failed to remove tag:", err);
                              }
                            }}
                            className="hover:text-cyan-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag..."
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        className="flex-1 text-sm"
                        data-testid={`input-add-tag-${customer.id}`}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter" && newTagInput.trim()) {
                            e.preventDefault();
                            setAddingTag(true);
                            try {
                              await apiRequest("POST", `/api/admin/customers/${customer.id}/tags`, { tag: newTagInput.trim().toLowerCase() });
                              queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0] as string)?.startsWith('/api/admin/customers') });
                              setNewTagInput("");
                            } catch (err) {
                              console.error("Failed to add tag:", err);
                            }
                            setAddingTag(false);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!newTagInput.trim() || addingTag}
                        data-testid={`button-add-tag-${customer.id}`}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!newTagInput.trim()) return;
                          setAddingTag(true);
                          try {
                            await apiRequest("POST", `/api/admin/customers/${customer.id}/tags`, { tag: newTagInput.trim().toLowerCase() });
                            queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0] as string)?.startsWith('/api/admin/customers') });
                            setNewTagInput("");
                          } catch (err) {
                            console.error("Failed to add tag:", err);
                          }
                          setAddingTag(false);
                        }}
                      >
                        {addingTag ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                      <Mail className="w-4 h-4" /> Email History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {emailsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    ) : !emails || emails.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No emails sent yet</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {emails.map((log) => (
                          <div key={log.id} className="flex items-start justify-between gap-2 text-sm pb-2 border-b border-border/50 last:border-0" data-testid={`email-log-${log.id}`}>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{log.subject}</p>
                              <p className="text-xs text-muted-foreground">{log.emailType.replace(/_/g, ' ')}</p>
                            </div>
                            <span className="text-muted-foreground text-xs whitespace-nowrap flex-shrink-0">
                              {new Date(log.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
}
