import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enGB } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { LogOut, Loader2, DoorOpen, MapPin, Clock, Phone, ExternalLink, CalendarDays } from "lucide-react";

const locales = { "en-GB": enGB };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: enGB }),
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  rawTiming: string;
  customerId: string;
  firstName: string;
  lastName: string;
  address: string;
  totalDoors: number;
  estimatedDays: number;
  grandTotal: number;
  doorStyle: string;
  pipelineStage: string;
  mobile: string;
}

interface RBCEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: CalendarEvent;
}

export default function AdminCalendar() {
  const [, setLocation] = useLocation();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<"month" | "week">("month");
  const [date, setDate] = useState(new Date());

  const { data: auth, isLoading: authLoading } = useQuery<{ authenticated: boolean } | null>({
    queryKey: ["/api/admin/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/admin/calendar"],
    enabled: !!auth?.authenticated,
    refetchInterval: 30000,
  });

  const rbcEvents: RBCEvent[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: new Date(e.start + "T00:00:00"),
    end: new Date(e.end + "T00:00:00"),
    resource: e,
  }));

  const handleLogout = async () => {
    await apiRequest("POST", "/api/admin/logout");
    queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
    setLocation("/admin");
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!auth?.authenticated) {
    setLocation("/admin");
    return null;
  }

  const eventStyleGetter = (event: RBCEvent) => {
    const stage = event.resource.pipelineStage;
    const bgColor = stage === "completed" ? "#059669" : "#10b981";
    return {
      style: {
        backgroundColor: bgColor,
        borderRadius: "4px",
        border: "none",
        color: "white",
        fontSize: "12px",
        fontWeight: 500,
        padding: "2px 6px",
      },
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-lg font-semibold" data-testid="text-calendar-title" style={{ color: "hsl(193 100% 45%)" }}>
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
              <Button variant="ghost" size="sm" className="font-bold underline" data-testid="link-calendar">Calendar</Button>
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

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2" data-testid="text-calendar-heading">
              <CalendarDays className="w-5 h-5" />
              Fitting Calendar
            </h2>
            <p className="text-sm text-muted-foreground">
              Showing {events.length} confirmed fitting{events.length !== 1 ? "s" : ""} (Booked &amp; Completed)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("month")}
              data-testid="button-month-view"
            >
              Month
            </Button>
            <Button
              variant={view === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("week")}
              data-testid="button-week-view"
            >
              Week
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="bg-white dark:bg-card rounded-lg border overflow-hidden" style={{ height: 680 }} data-testid="calendar-container">
            <Calendar
              localizer={localizer}
              events={rbcEvents}
              view={view}
              date={date}
              onNavigate={(newDate) => setDate(newDate)}
              onView={(newView) => setView(newView as "month" | "week")}
              onSelectEvent={(event) => setSelectedEvent(event.resource)}
              eventPropGetter={eventStyleGetter}
              popup
              culture="en-GB"
              views={[Views.MONTH, Views.WEEK]}
              style={{ height: "100%", padding: "12px" }}
            />
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#10b981" }} />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#059669" }} />
            <span>Completed</span>
          </div>
        </div>
      </main>

      <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {selectedEvent && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-lg" data-testid="sheet-event-title">
                  {selectedEvent.firstName} {selectedEvent.lastName}
                </SheetTitle>
                <Badge
                  className="w-fit"
                  style={{
                    backgroundColor: selectedEvent.pipelineStage === "completed" ? "#059669" : "#10b981",
                    color: "white",
                  }}
                  data-testid="sheet-event-stage"
                >
                  {selectedEvent.pipelineStage === "completed" ? "Completed" : "Booked"}
                </Badge>
              </SheetHeader>

              <div className="space-y-4">
                <Card data-testid="sheet-fitting-details">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Fitting Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CalendarDays className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium" data-testid="sheet-fitting-date">
                          {selectedEvent.rawTiming}
                        </div>
                        {selectedEvent.estimatedDays > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Est. {selectedEvent.estimatedDays} day{selectedEvent.estimatedDays !== 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedEvent.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-sm" data-testid="sheet-address">{selectedEvent.address}</span>
                      </div>
                    )}

                    {selectedEvent.mobile && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm" data-testid="sheet-mobile">{selectedEvent.mobile}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card data-testid="sheet-job-details">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Job Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm" data-testid="sheet-doors">
                        {selectedEvent.totalDoors} door{selectedEvent.totalDoors !== 1 ? "s" : ""}
                        {selectedEvent.doorStyle ? ` — ${selectedEvent.doorStyle}` : ""}
                      </span>
                    </div>

                    {selectedEvent.grandTotal > 0 && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium" data-testid="sheet-total">
                          £{selectedEvent.grandTotal.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Link href={`/admin/dashboard?customer=${selectedEvent.customerId}`}>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setSelectedEvent(null)}
                    data-testid="button-view-customer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Customer Record
                  </Button>
                </Link>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
