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
  const [file, setFile] = useState<File | null>(null);
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
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!title) {
        setTitle(e.target.files[0].name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !selectedModule || !title) {
      toast.error("Please fill in all required fields");
      return;
    }

    setUploading(true);

    try {
      // For now, we'll store a placeholder file path since storage bucket isn't set up yet
      // In production, you would upload to Supabase Storage first
      const filePath = `placeholder/${Date.now()}_${file.name}`;

      const { error } = await supabase.from("attachments").insert([
        {
          module_id: selectedModule,
          title: title,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size
        }
      ]);

      if (error) {
        toast.error("Failed to upload attachment");
        return;
      }

      toast.success("Attachment uploaded successfully");
      
      // Reset form
      setTitle("");
      setFile(null);
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
                required
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.code} - {subject.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="module">Module *</Label>
              <Select
                value={selectedModule}
                onValueChange={setSelectedModule}
                disabled={!selectedSubject}
                required
              >
                <SelectTrigger id="module">
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  {filteredModules.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No modules found for this subject
                    </div>
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
                  required
                />
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <File className="h-4 w-4" />
                    {(file.size / 1024 / 1024).toFixed(2)} MB
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
