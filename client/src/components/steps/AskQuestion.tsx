import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";

interface AskQuestionProps {
  onSubmit: (question: string, notes: string) => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
  isSubmitted: boolean;
}

export function AskQuestion({ onSubmit, onBack, isSubmitting, isSubmitted }: AskQuestionProps) {
  const [question, setQuestion] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!question.trim()) return;
    await onSubmit(question, notes);
  };

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto" data-testid="card-question-confirmation">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Question Received
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Thanks — we'll reply via WhatsApp as soon as possible.
          </p>
          <p className="text-muted-foreground text-xs mt-4 italic">
            We prefer WhatsApp for quicker responses
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="card-ask-question">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-semibold text-foreground">
          Ask a Question
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="question" className="text-sm font-medium">
            Your question
          </Label>
          <Textarea
            id="question"
            placeholder="What would you like to know?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="resize-none"
            rows={4}
            data-testid="input-question"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            Additional notes (optional)
          </Label>
          <Textarea
            id="notes"
            placeholder="Any other details that might help us answer your question..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-none"
            rows={3}
            data-testid="input-notes"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
            disabled={isSubmitting}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className="flex-1"
            disabled={isSubmitting || !question.trim()}
            data-testid="button-submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Question"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
