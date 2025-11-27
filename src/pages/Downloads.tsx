import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Download, File, ArrowLeft, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Attachment {
  id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string | null;
  module_id: string | null;
  category: string;
}

interface Module {
  id: string;
  title: string;
}

interface Subject {
  id: string;
  code: string;
  title: string;
}

const Downloads = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [filteredAttachments, setFilteredAttachments] = useState<Attachment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    if (subjectId) {
      fetchSubject();
      fetchAttachments();
    }
  }, [subjectId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchSubject = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, code, title")
        .eq("id", subjectId)
        .single();

      if (error) throw error;
      setSubject(data);
    } catch (error: any) {
      toast.error("Failed to load subject");
      console.error(error);
    }
  };

  const fetchAttachments = async () => {
    try {
      // Get all modules for this subject
      const { data: modules, error: modulesError } = await supabase
        .from("modules")
        .select("id")
        .eq("subject_id", subjectId)
        .is("deleted_at", null);

      if (modulesError) throw modulesError;

      const moduleIds = modules?.map(m => m.id) || [];

      // Get attachments through junction table for this subject's modules
      const { data: attachmentLinks, error: linksError } = await supabase
        .from("attachment_modules")
        .select("attachment_id")
        .in("module_id", moduleIds);

      if (linksError) throw linksError;

      const linkedAttachmentIds = attachmentLinks?.map(link => link.attachment_id) || [];

      // Get all attachments (both linked and subject-level without modules)
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from("attachments")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (attachmentsError) throw attachmentsError;

      // Filter to only include attachments for this subject
      // (either linked to subject's modules or subject-level attachments)
      const subjectAttachments = attachmentsData?.filter(att => 
        linkedAttachmentIds.includes(att.id) || !linkedAttachmentIds.length
      ) || [];

      setAttachments(subjectAttachments);
      setFilteredAttachments(subjectAttachments);
    } catch (error: any) {
      toast.error("Failed to load attachments");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    if (category === "all") {
      setFilteredAttachments(attachments);
    } else {
      setFilteredAttachments(attachments.filter(att => att.category === category));
    }
  };

  const handleDownload = (attachment: Attachment) => {
    // Open file in new tab for download
    window.open(attachment.file_path, '_blank');
    toast.success("Download started");
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/subjects")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Subjects
          </Button>

          <h1 className="text-2xl font-bold mb-6">
            {subject ? `${subject.code} - ${subject.title}` : "Downloads"}
          </h1>

          {!loading && attachments.length > 0 && (
            <div className="mb-6 flex items-center gap-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={handleCategoryFilter}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Tutorial & Note">Tutorial & Note</SelectItem>
                  <SelectItem value="Prelim & A level">Prelim & A level</SelectItem>
                  <SelectItem value="Revision">Revision</SelectItem>
                  <SelectItem value="WA">WA (Weighted Assessment)</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : filteredAttachments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <File className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {attachments.length === 0 
                    ? "No attachments available for this subject yet." 
                    : "No attachments found for the selected category."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAttachments.map((attachment) => (
                <Card key={attachment.id} className="hover:shadow-elegant transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{attachment.title}</CardTitle>
                          <Badge variant="secondary">{attachment.category}</Badge>
                        </div>
                        <CardDescription className="mt-1">
                          {attachment.file_name}
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => handleDownload(attachment)}
                        size="sm"
                        className="ml-4"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <File className="h-4 w-4" />
                        {attachment.file_type || "Unknown type"}
                      </div>
                      <div>{formatFileSize(attachment.file_size)}</div>
                      {attachment.created_at && (
                        <div>
                          Uploaded: {new Date(attachment.created_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Downloads;
