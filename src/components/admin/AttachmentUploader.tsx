import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, File, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Subject {
  id: string;
  code: string;
  title: string;
}

interface Module {
  id: string;
  title: string;
  subject_id: string;
}

const AttachmentUploader = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchModules(selectedSubject);
    } else {
      setModules([]);
      setSelectedModule("");
    }
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from("subjects")
      .select("id, code, title")
      .order("code");

    if (error) {
      toast.error("Failed to load subjects");
      return;
    }

    setSubjects(data || []);
  };

  const fetchModules = async (subjectId: string) => {
    const { data, error } = await supabase
      .from("modules")
      .select("id, title, subject_id")
      .eq("subject_id", subjectId)
      .order("order_index");

    if (error) {
      toast.error("Failed to load modules");
      return;
    }

    setModules(data || []);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      if (!title && selectedFiles.length === 1) {
        setTitle(selectedFiles[0].name);
      } else if (!title && selectedFiles.length > 1) {
        setTitle(`${selectedFiles.length} files`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSubject) {
      toast.error("Please select a subject");
      return;
    }

    if (!selectedModule) {
      toast.error("Please select a module");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    setUploading(true);

    try {
      // For now, we'll store placeholder file paths since storage bucket isn't set up yet
      // In production, you would upload to Supabase Storage first
      const attachments = files.map((file) => ({
        module_id: selectedModule,
        title: files.length === 1 ? title : `${title} - ${file.name}`,
        file_name: file.name,
        file_path: `placeholder/${Date.now()}_${file.name}`,
        file_type: file.type,
        file_size: file.size
      }));

      const { error } = await supabase.from("attachments").insert(attachments);

      if (error) {
        toast.error("Failed to upload attachments");
        return;
      }

      toast.success(`${files.length} attachment(s) uploaded successfully`);
      
      // Reset form
      setTitle("");
      setFiles([]);
      setSelectedModule("");
      setSelectedSubject("");
      
      // Reset file input
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

    } catch (error) {
      toast.error("An error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  const filteredModules = modules.filter(m => m.subject_id === selectedSubject);

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Note: File storage bucket needs to be configured for actual file uploads. Currently storing metadata only.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Upload New Attachment</CardTitle>
          <CardDescription>
            Upload PDFs, documents, or other course materials to a module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.length === 0 ? (
                    <SelectItem value="__no_subjects" disabled>
                      No subjects found. Create a subject first.
                    </SelectItem>
                  ) : (
                    subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.code} - {subject.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="module">Module *</Label>
              <Select
                value={selectedModule}
                onValueChange={setSelectedModule}
                disabled={!selectedSubject}
              >
                <SelectTrigger id="module">
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  {filteredModules.length === 0 ? (
                    <SelectItem value="__no_modules" disabled>
                      No modules found for this subject
                    </SelectItem>
                  ) : (
                    filteredModules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Chapter 1 Notes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">File *</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg"
                  multiple
                  required
                />
                {files.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <File className="h-4 w-4" />
                    {files.length} file(s) - {(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, DOC, DOCX, ZIP, PNG, JPG (Max 10MB)
              </p>
            </div>

            <Button type="submit" disabled={uploading} className="w-full">
              {uploading ? (
                <>Uploading...</>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Attachment
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttachmentUploader;
