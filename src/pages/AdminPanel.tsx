import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Paperclip, MessageCircle } from "lucide-react";
import SubjectManager from "@/components/admin/SubjectManager";
import ModuleManager from "@/components/admin/ModuleManager";
import AttachmentUploader from "@/components/admin/AttachmentUploader";
import AttachmentManager from "@/components/admin/AttachmentManager";
import QuestionManager from "@/components/admin/QuestionManager";
import { toast } from "sonner";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuthorization = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to access this page");
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const hasAccess = roles?.some(r => r.role === "admin" || r.role === "teacher");
      
      if (!hasAccess) {
        toast.error("You don't have permission to access this page");
        navigate("/");
        return;
      }

      setIsAuthorized(true);
      setLoading(false);
    };

    checkAuthorization();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Teacher Admin Panel</h1>
          <p className="text-muted-foreground">Manage subjects, modules, and course materials</p>
        </div>

        <Tabs defaultValue="subjects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-4xl">
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Modules
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="attachments" className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Manage Files
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Q&A
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subjects">
            <Card>
              <CardHeader>
                <CardTitle>Manage Subjects</CardTitle>
                <CardDescription>Create and edit subject information</CardDescription>
              </CardHeader>
              <CardContent>
                <SubjectManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules">
            <Card>
              <CardHeader>
                <CardTitle>Manage Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <ModuleManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Attachments</CardTitle>
                <CardDescription>Add PDFs, documents, and other course materials</CardDescription>
              </CardHeader>
              <CardContent>
                <AttachmentUploader />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attachments">
            <AttachmentManager />
          </TabsContent>

          <TabsContent value="questions">
            <QuestionManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
