import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import ResumeQuote from "@/pages/ResumeQuote";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancelled from "@/pages/PaymentCancelled";
import BalancePaid from "@/pages/BalancePaid";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminCampaigns from "@/pages/AdminCampaigns";
import AdminTemplates from "@/pages/AdminTemplates";
import AdminGallery from "@/pages/AdminGallery";
import AdminPipeline from "@/pages/AdminPipeline";
import AdminCalendar from "@/pages/AdminCalendar";
import Unsubscribe from "@/pages/Unsubscribe";
import Gallery from "@/pages/Gallery";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/resume/:token" component={ResumeQuote} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/payment-cancelled" component={PaymentCancelled} />
      <Route path="/balance-paid" component={BalancePaid} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/campaigns" component={AdminCampaigns} />
      <Route path="/admin/templates" component={AdminTemplates} />
      <Route path="/admin/gallery" component={AdminGallery} />
      <Route path="/admin/pipeline" component={AdminPipeline} />
      <Route path="/admin/calendar" component={AdminCalendar} />
      <Route path="/unsubscribe" component={Unsubscribe} />
      <Route path="/gallery" component={Gallery} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
