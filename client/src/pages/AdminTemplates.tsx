import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EmailTemplate } from "@shared/schema";
import { LogOut, Loader2, Save, Eye, RotateCcw, Mail, FileText } from "lucide-react";

const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  follow_up_1: {
    subject: "{{firstName}}, see what your home could look like",
    body: `<h3 style="color:#1f2937;margin:0 0 15px;">Hi {{firstName}},</h3>
<p style="color:#4b5563;line-height:1.6;">Thanks for getting your quote for <strong>{{totalDoors}} {{doorStyle}} doors</strong> at <strong>{{grandTotal}}</strong>. I just wanted to quickly show you what a difference new doors can make.</p>
<p style="color:#4b5563;line-height:1.6;">Last week, a customer in Solihull had 5 doors fitted. She said: <em>"I can't believe the difference - the whole house feels brand new. I wish I'd done it sooner!"</em></p>
<p style="color:#4b5563;line-height:1.6;">That's what we hear from almost every customer. New internal doors are one of the simplest ways to transform your home - and with everything included (premium handles, hinges, latches, and professional fitting), we make it easy.</p>
<div style="background:#f0fafb;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #0091b3;">
<p style="color:#1f2937;font-weight:600;margin:0 0 8px;">See what your home could look like</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 12px;">Take a look at some of our recent transformations - real homes, real doors, real results.</p>
<a href="{{galleryUrl}}" style="color:#0091b3;font-weight:600;text-decoration:none;">View Our Gallery &rarr;</a>
</div>
<div style="background:#f0f9ff;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e0f2fe;text-align:center;">
<p style="color:#1f2937;font-weight:600;margin:0 0 8px;">Don't just take my word for it</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 12px;font-size:14px;">See what my customers say &mdash; 15 years of happy homeowners and counting.</p>
<a href="https://www.facebook.com/doorsondemand10/reviews" style="display:inline-block;padding:10px 20px;background:#1877F2;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Read My Facebook Reviews</a>
</div>
<div style="text-align:center;margin:25px 0;">
<a href="{{resumeUrl}}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Continue &amp; Book Your Fitting</a>
</div>
<p style="color:#6b7280;line-height:1.6;">Just 3 quick steps to complete your booking:</p>
<p style="color:#6b7280;line-height:1.8;">1. Confirm your door sizes<br>2. Pick your preferred fitting date<br>3. Pay your 50% deposit to secure</p>
<p style="color:#4b5563;line-height:1.6;">Any questions at all? I'm always happy to chat.</p>
<div style="text-align:center;margin:25px 0;">
<a href="https://wa.me/447854015863" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 25px;border-radius:6px;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Best wishes,<br><strong>Mark</strong><br>Doors On Demand</p>`,
  },
  follow_up_2: {
    subject: "{{firstName}}, got questions about your door quote?",
    body: `<h3 style="color:#1f2937;margin:0 0 15px;">Hi {{firstName}},</h3>
<p style="color:#4b5563;line-height:1.6;">I know getting new doors is a big decision, so I wanted to answer the 3 most common questions I get:</p>
<div style="background:#f8f9fa;border-radius:8px;padding:20px;margin:15px 0;">
<p style="color:#1f2937;font-weight:600;margin:0 0 6px;">"Will it be messy?"</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 15px;">Not at all. I fit doors cleanly and tidy up after myself. Most customers are surprised how quick and clean the process is - usually done in a day.</p>
<p style="color:#1f2937;font-weight:600;margin:0 0 6px;">"What if my door frames aren't standard?"</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 15px;">No problem. I measure everything on the day and trim to fit. Every home is different and I've seen it all - victorian, new-build, everything in between.</p>
<p style="color:#1f2937;font-weight:600;margin:0 0 6px;">"Is it really all-inclusive?"</p>
<p style="color:#4b5563;line-height:1.5;margin:0;">Yes - your quote of <strong>{{grandTotal}}</strong> covers the {{doorStyle}} doors, premium handles, hinges, latches, and professional fitting. No hidden extras. You pay {{deposit}} to book, and the rest on completion.</p>
</div>
<div style="background:#f0f9ff;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e0f2fe;text-align:center;">
<p style="color:#1f2937;font-weight:600;margin:0 0 8px;">Don't just take my word for it</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 12px;font-size:14px;">See what my customers say &mdash; 15 years of happy homeowners and counting.</p>
<a href="https://www.facebook.com/doorsondemand10/reviews" style="display:inline-block;padding:10px 20px;background:#1877F2;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Read My Facebook Reviews</a>
</div>
<div style="text-align:center;margin:25px 0;">
<a href="{{resumeUrl}}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Continue &amp; Book Your Fitting</a>
</div>
<p style="color:#6b7280;line-height:1.6;">Just 3 quick steps to complete your booking:</p>
<p style="color:#6b7280;line-height:1.8;">1. Confirm your door sizes<br>2. Pick your preferred fitting date<br>3. Pay your 50% deposit to secure</p>
<p style="color:#4b5563;line-height:1.6;">Still have questions? I'm always happy to have a quick chat - no pressure whatsoever.</p>
<div style="text-align:center;margin:25px 0;">
<a href="https://wa.me/447854015863" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 25px;border-radius:6px;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
</div>
<p style="color:#4b5563;line-height:1.6;">All the best,<br><strong>Mark</strong><br>Doors On Demand</p>`,
  },
  follow_up_3: {
    subject: "{{firstName}}, fitting dates are going fast",
    body: `<h3 style="color:#1f2937;margin:0 0 15px;">Hi {{firstName}},</h3>
<p style="color:#4b5563;line-height:1.6;">Quick update - my diary is filling up fast over the next few weeks. I only take on a limited number of fittings each month so I can give every job the time and attention it deserves.</p>
<p style="color:#4b5563;line-height:1.6;">Your quote for <strong>{{totalDoors}} {{doorStyle}} doors</strong> at <strong>{{grandTotal}}</strong> is still valid, but I wanted to let you know that popular dates are going quickly.</p>
<p style="color:#4b5563;line-height:1.6;">A lot of homeowners tell me they spent weeks getting quotes from different companies - only to come back to us because we include everything in one simple price. No chasing separate tradesmen, no surprise costs, no mess left behind.</p>
<div style="background:#f0fafb;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #0091b3;">
<p style="color:#1f2937;font-weight:600;margin:0 0 8px;">See our latest work</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 12px;">Browse real before &amp; after photos from recent fittings across the West Midlands.</p>
<a href="{{galleryUrl}}" style="color:#0091b3;font-weight:600;text-decoration:none;">View Our Gallery &rarr;</a>
</div>
<div style="background:#f0f9ff;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e0f2fe;text-align:center;">
<p style="color:#1f2937;font-weight:600;margin:0 0 8px;">Don't just take my word for it</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 12px;font-size:14px;">See what my customers say &mdash; 15 years of happy homeowners and counting.</p>
<a href="https://www.facebook.com/doorsondemand10/reviews" style="display:inline-block;padding:10px 20px;background:#1877F2;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Read My Facebook Reviews</a>
</div>
<div style="text-align:center;margin:25px 0;">
<a href="{{resumeUrl}}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Continue &amp; Book Your Fitting</a>
</div>
<p style="color:#6b7280;line-height:1.6;">Just 3 quick steps to complete your booking:</p>
<p style="color:#6b7280;line-height:1.8;">1. Confirm your door sizes<br>2. Pick your preferred fitting date<br>3. Pay your 50% deposit to secure</p>
<p style="color:#4b5563;line-height:1.6;">If you'd like to lock in a date before they're gone, just click above. Or drop me a message if you'd like to chat first.</p>
<div style="text-align:center;margin:25px 0;">
<a href="https://wa.me/447854015863" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 25px;border-radius:6px;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Best wishes,<br><strong>Mark</strong><br>Doors On Demand</p>`,
  },
  follow_up_4: {
    subject: "{{firstName}}, one last thing about your home",
    body: `<h3 style="color:#1f2937;margin:0 0 15px;">Hi {{firstName}},</h3>
<p style="color:#4b5563;line-height:1.6;">This is my last message about your door quote, and I wanted to leave you with this thought.</p>
<p style="color:#4b5563;line-height:1.6;">Every homeowner I've worked with says the same thing: <em>"I wish I'd done this years ago."</em> Not because the doors are fancy or expensive - but because walking through your home and seeing beautiful, solid oak doors makes you feel proud of where you live.</p>
<p style="color:#4b5563;line-height:1.6;">Your home is where you spend most of your time. It should make you smile when you walk through it. And honestly, new internal doors are one of the easiest and most affordable ways to make that happen.</p>
<p style="color:#4b5563;line-height:1.6;">Your quote for <strong>{{totalDoors}} {{doorStyle}} doors</strong> at <strong>{{grandTotal}}</strong> is still waiting for you - everything included, no hidden costs.</p>
<div style="background:#f0fafb;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid #0091b3;">
<p style="color:#1f2937;font-weight:600;margin:0 0 8px;">See homes we've transformed</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 12px;">Take a look at the difference new doors make - you might be surprised.</p>
<a href="{{galleryUrl}}" style="color:#0091b3;font-weight:600;text-decoration:none;">View Our Gallery &rarr;</a>
</div>
<div style="background:#f0f9ff;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #e0f2fe;text-align:center;">
<p style="color:#1f2937;font-weight:600;margin:0 0 8px;">Don't just take my word for it</p>
<p style="color:#4b5563;line-height:1.5;margin:0 0 12px;font-size:14px;">See what my customers say &mdash; 15 years of happy homeowners and counting.</p>
<a href="https://www.facebook.com/doorsondemand10/reviews" style="display:inline-block;padding:10px 20px;background:#1877F2;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">Read My Facebook Reviews</a>
</div>
<div style="text-align:center;margin:25px 0;">
<a href="{{resumeUrl}}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Continue &amp; Book Your Fitting</a>
</div>
<p style="color:#6b7280;line-height:1.6;">Just 3 quick steps to complete your booking:</p>
<p style="color:#6b7280;line-height:1.8;">1. Confirm your door sizes<br>2. Pick your preferred fitting date<br>3. Pay your 50% deposit to secure</p>
<p style="color:#4b5563;line-height:1.6;">No pressure at all, {{firstName}}. But if you do decide to go ahead, I'd love to help make it happen. Just drop me a message anytime.</p>
<div style="text-align:center;margin:25px 0;">
<a href="https://wa.me/447854015863" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 25px;border-radius:6px;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
</div>
<p style="color:#4b5563;line-height:1.6;">All the best,<br><strong>Mark</strong><br>Doors On Demand</p>`,
  },
  abandoned_quote_recovery: {
    subject: "{{firstName}}, you left your quote unfinished…",
    body: `<h3 style="color:#1f2937;margin:0 0 15px;">Hi {{firstName}},</h3>
<p style="color:#4b5563;line-height:1.6;">You started building your door quote with us but didn't quite finish - no worries at all, life gets busy!</p>
<p style="color:#4b5563;line-height:1.6;">The good news is your quote is saved and ready for you. Just click the button below to pick up exactly where you left off - it only takes a couple of minutes to complete.</p>
<div style="background:#f0fafb;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:4px solid #0091b3;">
<p style="color:#1f2937;font-weight:600;margin:0 0 4px;">Your saved configuration</p>
<p style="color:#4b5563;margin:0;">{{configSummary}}</p>
</div>
<div style="text-align:center;margin:25px 0;">
<a href="{{resumeUrl}}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Resume My Quote</a>
</div>
<p style="color:#4b5563;line-height:1.6;">If you have any questions before you complete your quote, I'm always happy to help - just drop me a message on WhatsApp.</p>
<div style="text-align:center;margin:25px 0;">
<a href="https://wa.me/447854015863" style="display:inline-block;background:#25D366;color:#ffffff;padding:10px 25px;border-radius:6px;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Best wishes,<br><strong>Mark</strong><br>Doors On Demand</p>`,
  },
  balance_payment: {
    subject: "Your balance payment - {{balanceAmount}}",
    body: `<h3 style="color:#1f2937;margin:0 0 15px;">Hi {{firstName}},</h3>
<p style="color:#4b5563;line-height:1.6;">Great news - your doors have been fitted! We hope you love them.</p>
<p style="color:#4b5563;line-height:1.6;">The remaining balance of <strong>{{balanceAmount}}</strong> is now due. You can pay securely using the link below:</p>
<div style="text-align:center;margin:25px 0;">
<a href="{{paymentLink}}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Pay {{balanceAmount}} Balance</a>
</div>
<p style="color:#4b5563;line-height:1.6;">If you have any questions, just reply to this email or message me on WhatsApp.</p>
<p style="color:#4b5563;line-height:1.6;">Thanks again for choosing Doors On Demand!<br><strong>Mark</strong></p>`,
  },
  review_request: {
    subject: "{{firstName}}, how are your new doors?",
    body: `<h3 style="color:#1f2937;margin:0 0 15px;">Hi {{firstName}},</h3>
<p style="color:#4b5563;line-height:1.6;">Thank you so much for your final payment - everything is now settled.</p>
<p style="color:#4b5563;line-height:1.6;">We really hope you're enjoying your new doors! If you've got a moment, we'd be incredibly grateful if you could leave us a quick review. It helps other homeowners find us and means the world to a small business like ours.</p>
<div style="text-align:center;margin:25px 0;">
<a href="{{reviewLink}}" style="display:inline-block;background:#0091b3;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Leave a Review</a>
</div>
<p style="color:#4b5563;line-height:1.6;">Thanks for choosing Doors On Demand - it's been a pleasure working with you!</p>
<p style="color:#4b5563;line-height:1.6;">Best wishes,<br><strong>Mark</strong><br>Doors On Demand</p>`,
  },
  google_review_request: {
    subject: "{{firstName}}, would you leave us a Google review?",
    body: `<h3 style="color:#1f2937;margin:0 0 15px;">Hi {{firstName}},</h3>
<p style="color:#4b5563;line-height:1.6;">Thank you so much for choosing Doors On Demand - it was a real pleasure working with you, and we hope you're loving your new doors!</p>
<p style="color:#4b5563;line-height:1.6;">If you have a spare moment, we'd be incredibly grateful if you could leave us a quick review on Google. It makes a huge difference to a small business like ours and helps other homeowners find us.</p>
<div style="text-align:center;margin:30px 0;">
<a href="{{googleReviewUrl}}" style="display:inline-block;background:#4285F4;color:#ffffff;padding:14px 35px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Leave a Google Review &#9733;</a>
</div>
<p style="color:#4b5563;line-height:1.6;">It only takes a minute and means the world to us. Thank you!</p>
<p style="color:#4b5563;line-height:1.6;">Best wishes,<br><strong>Mark</strong><br>Doors On Demand</p>`,
  },
};

export default function AdminTemplates() {
  const [, setLocation] = useLocation();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const { data: auth, isLoading: authLoading } = useQuery<{ authenticated: boolean } | null>({
    queryKey: ["/api/admin/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: templates, isLoading: templatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/email-templates"],
    enabled: auth?.authenticated === true,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", `/api/admin/email-templates/${selectedKey}`, {
        subject: editSubject,
        body: editBody,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      toast({ title: "Template saved", description: "Email template has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save template.", variant: "destructive" });
    },
  });

  const previewMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/email-templates/preview", {
        subject: editSubject,
        body: editBody,
      });
      return res.json();
    },
    onSuccess: (data: { subject: string; html: string }) => {
      const htmlWithBaseTarget = data.html.replace('<head>', '<head><base target="_blank">');
      setPreviewHtml(htmlWithBaseTarget);
      setPreviewOpen(true);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate preview.", variant: "destructive" });
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

  function selectTemplate(template: EmailTemplate) {
    setSelectedKey(template.templateKey);
    setEditSubject(template.subject);
    setEditBody(template.body);
  }

  function handleReset() {
    if (!selectedKey) return;
    const defaults = DEFAULT_TEMPLATES[selectedKey];
    if (defaults) {
      setEditSubject(defaults.subject);
      setEditBody(defaults.body);
    }
  }

  const selectedTemplate = templates?.find(t => t.templateKey === selectedKey);

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
        <h2 className="text-xl font-semibold" data-testid="text-templates-title">Email Templates</h2>

        {templatesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              {(templates || []).map((template) => (
                <Card
                  key={template.templateKey}
                  className={`cursor-pointer ${selectedKey === template.templateKey ? 'ring-2' : ''}`}
                  style={selectedKey === template.templateKey ? { borderColor: 'hsl(193 100% 45%)' } : undefined}
                  onClick={() => selectTemplate(template)}
                  data-testid={`card-template-${template.templateKey}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" style={{ color: "hsl(193 100% 45%)" }} />
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground truncate" data-testid={`text-template-subject-${template.templateKey}`}>
                      {template.subject}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated: {new Date(template.updatedAt).toLocaleDateString("en-GB")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-2">
              {selectedKey && selectedTemplate ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {selectedTemplate.name}
                      </CardTitle>
                    </div>
                    <div className="flex gap-1 flex-wrap mt-2">
                      {selectedTemplate.availableVariables.split(", ").map((v) => (
                        <Badge
                          key={v}
                          variant="secondary"
                          className="text-xs no-default-hover-elevate"
                          data-testid={`badge-variable-${v}`}
                        >
                          {`{{${v}}}`}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-subject">Subject Line</Label>
                      <Input
                        id="template-subject"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        data-testid="input-template-subject"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-body">Body (HTML)</Label>
                      <Textarea
                        id="template-body"
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={16}
                        className="font-mono text-xs"
                        data-testid="input-template-body"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        onClick={() => saveMutation.mutate()}
                        disabled={saveMutation.isPending}
                        style={{ backgroundColor: "hsl(193 100% 45%)" }}
                        data-testid="button-save-template"
                      >
                        {saveMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <Save className="w-4 h-4 mr-1" />
                        )}
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => previewMutation.mutate()}
                        disabled={previewMutation.isPending}
                        data-testid="button-preview-template"
                      >
                        {previewMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <Eye className="w-4 h-4 mr-1" />
                        )}
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        data-testid="button-reset-template"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reset to Default
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Mail className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Select a template to edit</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <iframe
            ref={iframeRef}
            srcDoc={previewHtml}
            className="w-full border rounded-md"
            style={{ height: "500px" }}
            title="Email Preview"
            sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            data-testid="iframe-email-preview"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
