import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, FileText } from "lucide-react";
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
  description: string;
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
  description: string;
  order_index: number;
}

interface Attachment {
  id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_type: string;
}

const ModuleReader = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState<Module | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [submodules, setSubmodules] = useState<Submodule[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

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

      const [subjectResult, submodulesResult, attachmentsResult] = await Promise.all([
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
      ]);

      if (subjectResult.data) setSubject(subjectResult.data);
      if (submodulesResult.data) setSubmodules(submodulesResult.data);
      if (attachmentsResult.data) setAttachments(attachmentsResult.data);
    } catch (error: any) {
      toast.error("Failed to load module");
      console.error(error);
    } finally {
      setLoading(false);
    }
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
              <h1 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                {module.title}
              </h1>
              {module.description && (
                <p className="text-muted-foreground mb-6">{module.description}</p>
              )}
              <Separator className="my-6" />
              {module.content ? (
                <div className="prose prose-slate max-w-none dark:prose-invert">
                  <div dangerouslySetInnerHTML={{ __html: module.content }} />
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
                        {submodule.description && (
                          <p className="text-muted-foreground">{submodule.description}</p>
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
            <Card>
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
                            {attachment.file_name}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ModuleReader;
