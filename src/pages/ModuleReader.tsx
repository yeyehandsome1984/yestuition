import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Download, FileText, Maximize2, MessageCircle, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Module {
  id: string;
  title: string;
  key_concept: string | null;
  prelim_year_tested: string | null;
  a_level_year_tested: string | null;
  content: string;
  subject_id: string;
}

interface Subject {
  id: string;
  code: string;
  title: string;
}

interface Submodule {
  id: string;
  title: string;
  key_concept: string | null;
  order_index: number;
}

interface Attachment {
  id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
}

interface Question {
  id: string;
  question: string;
  answer: string | null;
  user_id: string;
  answered_by: string | null;
  answered_at: string | null;
  created_at: string;
}

const ModuleReader = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState<Module | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [submodules, setSubmodules] = useState<Submodule[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contentFullscreen, setContentFullscreen] = useState(false);

  useEffect(() => {
    if (moduleId) {
      fetchModuleData();
    }
  }, [moduleId]);

  const fetchModuleData = async () => {
    try {
      const moduleResult = await supabase
        .from("modules")
        .select("*")
        .eq("id", moduleId)
        .single();

      if (moduleResult.error) throw moduleResult.error;
      setModule(moduleResult.data);

      const [subjectResult, submodulesResult, attachmentsResult, questionsResult] = await Promise.all([
        supabase
          .from("subjects")
          .select("*")
          .eq("id", moduleResult.data.subject_id)
          .single(),
        supabase
          .from("modules")
          .select("*")
          .eq("parent_id", moduleId)
          .order("order_index"),
        supabase
          .from("attachments")
          .select("*")
          .eq("module_id", moduleId),
        supabase
          .from("module_questions")
          .select("*")
          .eq("module_id", moduleId)
          .order("created_at", { ascending: false }),
      ]);

      if (subjectResult.data) setSubject(subjectResult.data);
      if (submodulesResult.data) setSubmodules(submodulesResult.data);
      if (attachmentsResult.data) setAttachments(attachmentsResult.data);
      if (questionsResult.data) setQuestions(questionsResult.data);
    } catch (error: any) {
      toast.error("Failed to load module");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    setSubmittingQuestion(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to ask questions");
        return;
      }

      const { error } = await supabase
        .from("module_questions")
        .insert({
          module_id: moduleId!,
          user_id: user.id,
          question: newQuestion.trim()
        });

      if (error) throw error;

      toast.success("Question submitted successfully");
      setNewQuestion("");
      fetchModuleData();
    } catch (error) {
      toast.error("Failed to submit question");
      console.error(error);
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleDownloadAttachment = (attachment: Attachment) => {
    // This would be replaced with actual Supabase storage download
    toast.info(`Download functionality coming soon: ${attachment.file_name}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96" />
        </main>
      </div>
    );
  }

  if (!module || !subject) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navigation />
        <main className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Module not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(`/subjects/${subject.id}/modules`)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Modules
          </Button>

          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate("/subjects")}>
                  Subjects
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate(`/subjects/${subject.id}/modules`)}>
                  {subject.code}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{module.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Card className="mb-6">
            <CardContent className="p-8">
              <h1 className="text-3xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
                {module.title}
              </h1>
              
              {/* Key Concept */}
              {module.key_concept && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Key Concept
                  </h3>
                  <p className="text-foreground">{module.key_concept}</p>
                </div>
              )}

              {/* Year Tested */}
              {(module.prelim_year_tested || module.a_level_year_tested) && (
                <div className="mb-6 p-4 rounded-lg border border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Year Tested
                  </h3>
                  <div className="space-y-2">
                    {module.prelim_year_tested && (
                      <div>
                        <span className="font-medium text-foreground">Prelim: </span>
                        <span className="text-foreground">{module.prelim_year_tested}</span>
                      </div>
                    )}
                    {module.a_level_year_tested && (
                      <div>
                        <span className="font-medium text-foreground">A Level: </span>
                        <span className="text-foreground">{module.a_level_year_tested}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator className="my-6" />
              {module.content ? (
                <div>
                  <div className="flex justify-end mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setContentFullscreen(true)}
                    >
                      <Maximize2 className="h-4 w-4 mr-2" />
                      View Fullscreen
                    </Button>
                  </div>
                  <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground">
                    <div dangerouslySetInnerHTML={{ __html: module.content }} />
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No content available yet.</p>
              )}
            </CardContent>
          </Card>

          {submodules.length > 0 && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Submodules</h2>
                <Accordion type="single" collapsible className="w-full">
                  {submodules.map((submodule) => (
                    <AccordionItem key={submodule.id} value={submodule.id}>
                      <AccordionTrigger>{submodule.title}</AccordionTrigger>
                      <AccordionContent>
                        {submodule.key_concept && (
                          <p className="text-muted-foreground">{submodule.key_concept}</p>
                        )}
                        <Button
                          variant="link"
                          className="mt-2 p-0"
                          onClick={() => navigate(`/modules/${submodule.id}`)}
                        >
                          View Full Content
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {attachments.length > 0 && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Attachments</h2>
                <div className="space-y-3">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{attachment.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {attachment.file_name} • {(attachment.file_size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadAttachment(attachment)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Q&A Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Questions & Answers
              </CardTitle>
              <CardDescription>
                Ask questions about this module and get answers from teachers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Ask Question Form */}
              <form onSubmit={handleSubmitQuestion} className="space-y-4">
                <Textarea
                  placeholder="Ask a question about this module..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <Button type="submit" disabled={submittingQuestion || !newQuestion.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  {submittingQuestion ? "Submitting..." : "Submit Question"}
                </Button>
              </form>

              {/* Questions List */}
              <div className="space-y-4">
                {questions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No questions yet. Be the first to ask!
                  </p>
                ) : (
                  questions.map((q) => (
                    <Card key={q.id} className="bg-accent/30">
                      <CardContent className="pt-6 space-y-4">
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-foreground">{q.question}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Asked on {new Date(q.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {q.answer && (
                          <div className="pl-4 border-l-2 border-primary">
                            <p className="text-sm text-foreground mb-2">{q.answer}</p>
                            <p className="text-xs text-muted-foreground">
                              Answered on {q.answered_at && new Date(q.answered_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {!q.answer && (
                          <p className="text-sm text-muted-foreground italic">
                            Waiting for teacher's response...
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={contentFullscreen} onOpenChange={setContentFullscreen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{module.title}</DialogTitle>
          </DialogHeader>
          <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground py-4">
            <div dangerouslySetInnerHTML={{ __html: module.content }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModuleReader;
