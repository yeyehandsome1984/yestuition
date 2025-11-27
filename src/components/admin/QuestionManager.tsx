import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  question: string;
  answer: string | null;
  answered_at: string | null;
  created_at: string;
  module_id: string;
  modules: {
    title: string;
    subjects: {
      code: string;
    };
  };
}

const QuestionManager = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("module_questions")
        .select(`
          *,
          modules(
            title,
            subjects(code)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      toast.error("Failed to load questions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (questionId: string) => {
    if (!answerText.trim()) {
      toast.error("Please enter an answer");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in");
        return;
      }

      const { error } = await supabase
        .from("module_questions")
        .update({
          answer: answerText.trim(),
          answered_by: user.id,
          answered_at: new Date().toISOString()
        })
        .eq("id", questionId);

      if (error) throw error;

      toast.success("Answer submitted successfully");
      setAnsweringId(null);
      setAnswerText("");
      fetchQuestions();
    } catch (error) {
      toast.error("Failed to submit answer");
      console.error(error);
    }
  };

  if (loading) {
    return <div>Loading questions...</div>;
  }

  const unansweredQuestions = questions.filter(q => !q.answer);
  const answeredQuestions = questions.filter(q => q.answer);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Student Questions
          </CardTitle>
          <CardDescription>
            View and answer student questions from all modules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Unanswered Questions */}
          {unansweredQuestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Unanswered ({unansweredQuestions.length})
              </h3>
              {unansweredQuestions.map((q) => (
                <Card key={q.id} className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-foreground mb-2">{q.question}</p>
                          <Badge variant="outline" className="text-xs">
                            {q.modules?.subjects?.code} - {q.modules?.title}
                          </Badge>
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Asked on {new Date(q.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {answeringId === q.id ? (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Type your answer here..."
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          rows={4}
                          className="resize-none"
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => handleAnswer(q.id)}>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Answer
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setAnsweringId(null);
                              setAnswerText("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setAnsweringId(q.id)}
                        variant="outline"
                      >
                        Answer Question
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Answered Questions */}
          {answeredQuestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Answered ({answeredQuestions.length})
              </h3>
              {answeredQuestions.map((q) => (
                <Card key={q.id} className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-foreground mb-2">{q.question}</p>
                          <Badge variant="outline" className="text-xs">
                            {q.modules?.subjects?.code} - {q.modules?.title}
                          </Badge>
                        </div>
                        <Badge variant="default" className="bg-green-600">Answered</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Asked on {new Date(q.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="pl-4 border-l-2 border-green-600">
                      <p className="text-sm text-foreground mb-2">{q.answer}</p>
                      <p className="text-xs text-muted-foreground">
                        Answered on {q.answered_at && new Date(q.answered_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {questions.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No questions yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionManager;
