import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailX, MailCheck, Loader2 } from "lucide-react";

export default function Unsubscribe() {
  const [status, setStatus] = useState<"loading" | "unsubscribed" | "resubscribed" | "error">("loading");
  const [email, setEmail] = useState("");
  const [resubscribing, setResubscribing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (!emailParam) {
      setStatus("error");
      return;
    }
    setEmail(emailParam);
    fetch(`/api/unsubscribe?email=${encodeURIComponent(emailParam)}`, { credentials: "include" })
      .then((res) => {
        if (res.ok) setStatus("unsubscribed");
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, []);

  async function handleResubscribe() {
    setResubscribing(true);
    try {
      const res = await fetch(`/api/resubscribe?email=${encodeURIComponent(email)}`, { credentials: "include" });
      if (res.ok) setStatus("resubscribed");
      else setStatus("error");
    } catch {
      setStatus("error");
    } finally {
      setResubscribing(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div
            className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: status === "resubscribed" ? "hsl(142 71% 45% / 0.1)" : "hsl(193 100% 45% / 0.1)",
            }}
          >
            {status === "resubscribed" ? (
              <MailCheck className="w-6 h-6" style={{ color: "hsl(142 71% 45%)" }} />
            ) : (
              <MailX className="w-6 h-6" style={{ color: "hsl(193 100% 45%)" }} />
            )}
          </div>
          <CardTitle className="text-xl" data-testid="text-unsubscribe-title">
            {status === "unsubscribed" && "You've Been Unsubscribed"}
            {status === "resubscribed" && "You've Been Resubscribed"}
            {status === "error" && "Something Went Wrong"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "unsubscribed" && (
            <>
              <p className="text-sm text-muted-foreground" data-testid="text-unsubscribe-message">
                You will no longer receive marketing emails from Doors On Demand.
              </p>
              <Button
                variant="outline"
                onClick={handleResubscribe}
                disabled={resubscribing}
                data-testid="button-resubscribe"
              >
                {resubscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Changed your mind? Resubscribe"}
              </Button>
            </>
          )}
          {status === "resubscribed" && (
            <p className="text-sm text-muted-foreground" data-testid="text-resubscribe-message">
              You've been resubscribed and will receive future emails from Doors On Demand.
            </p>
          )}
          {status === "error" && (
            <p className="text-sm text-muted-foreground" data-testid="text-error-message">
              We couldn't process your request. Please try again or contact support.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
