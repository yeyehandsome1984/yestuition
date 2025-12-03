import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, File } from "lucide-react";
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

interface Attachment {
  id: string;
  title: string;
  file_name: string;
  file_path: string;
  category: string;
  file_size: number | null;
  created_at: string;
  subject_id: string | null;
  linked_modules?: { module_id: string; module_title: string }[];
}

const CATEGORIES = [
  "Tutorial & Note",
  "Prelim & A level",
  "Revision",
  "WA",
  "Others",
];

const AttachmentManager = () => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [editingAttachment, setEditingAttachment] = useState<Attachment | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    category: "",
    selectedModuleIds: [] as string[],
  });
  const [selectedSubject, setSelectedSubject] = useState("");
  
  // Filter states
  const [filterSubject, setFilterSubject] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    fetchAttachments();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchModules(selectedSubject);
    } else {
      setModules([]);
    }
  }, [selectedSubject]);

  const fetchAttachments = async () => {
    const { data: attachmentsData, error: attachmentsError } = await supabase
      .from("attachments")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (attachmentsError) {
      toast.error("Failed to load attachments");
      return;
    }

    // Fetch linked modules for each attachment
    const attachmentsWithModules = await Promise.all(
      (attachmentsData || []).map(async (attachment) => {
        const { data: links } = await supabase
          .from("attachment_modules")
          .select("module_id, modules(title)")
          .eq("attachment_id", attachment.id);

        return {
          ...attachment,
          subject_id: attachment.subject_id,
          linked_modules: links?.map((link: any) => ({
            module_id: link.module_id,
            module_title: link.modules?.title || "Unknown",
          })) || [],
        };
      })
    );

    setAttachments(attachmentsWithModules);
  };

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
      .is("deleted_at", null)
      .order("order_index");

    if (error) {
      toast.error("Failed to load modules");
      return;
    }

    setModules(data || []);
  };

  const handleEdit = (attachment: Attachment) => {
    setEditingAttachment(attachment);
    setEditFormData({
      title: attachment.title,
      category: attachment.category,
      selectedModuleIds: attachment.linked_modules?.map(m => m.module_id) || [],
    });
    
    // Set subject for the first linked module if available
    if (attachment.linked_modules && attachment.linked_modules.length > 0) {
      const firstModuleId = attachment.linked_modules[0].module_id;
      const module = modules.find(m => m.id === firstModuleId);
      if (module) {
        setSelectedSubject(module.subject_id);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editingAttachment) return;

    // Determine subject_id based on selected modules or selected subject
    let subjectId = selectedSubject;
    if (editFormData.selectedModuleIds.length > 0) {
      // Get subject_id from the first selected module
      const firstModule = modules.find(m => editFormData.selectedModuleIds.includes(m.id));
      if (firstModule) {
        subjectId = firstModule.subject_id;
      }
    }

    // Update attachment details including subject_id
    const { error: updateError } = await supabase
      .from("attachments")
      .update({
        title: editFormData.title,
        category: editFormData.category,
        subject_id: subjectId,
      })
      .eq("id", editingAttachment.id);

    if (updateError) {
      toast.error("Failed to update attachment");
      return;
    }

    // Delete existing module links
    const { error: deleteLinksError } = await supabase
      .from("attachment_modules")
      .delete()
      .eq("attachment_id", editingAttachment.id);

    if (deleteLinksError) {
      toast.error("Failed to update module links");
      return;
    }

    // Create new module links
    if (editFormData.selectedModuleIds.length > 0) {
      const links = editFormData.selectedModuleIds.map(moduleId => ({
        attachment_id: editingAttachment.id,
        module_id: moduleId,
      }));

      const { error: insertLinksError } = await supabase
        .from("attachment_modules")
        .insert(links);

      if (insertLinksError) {
        toast.error("Failed to link modules");
        return;
      }
    }

    toast.success("Attachment updated successfully");
    setEditingAttachment(null);
    setSelectedSubject("");
    fetchAttachments();
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return;

    const { error } = await supabase
      .from("attachments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", attachmentId);

    if (error) {
      toast.error("Failed to delete attachment");
      return;
    }

    toast.success("Attachment deleted successfully");
    fetchAttachments();
  };

  const handleModuleToggle = (moduleId: string) => {
    setEditFormData(prev => ({
      ...prev,
      selectedModuleIds: prev.selectedModuleIds.includes(moduleId)
        ? prev.selectedModuleIds.filter(id => id !== moduleId)
        : [...prev.selectedModuleIds, moduleId],
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Manage Attachments</CardTitle>
              <CardDescription>
                Edit attachment details and link attachments to multiple modules
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All Subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All Types</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(() => {
              const filteredAttachments = attachments.filter((att) => {
                const subjectMatch = !filterSubject || filterSubject === "__all" || att.subject_id === filterSubject;
                const categoryMatch = !filterCategory || filterCategory === "__all" || att.category === filterCategory;
                return subjectMatch && categoryMatch;
              });
              
              if (filteredAttachments.length === 0) {
                return <p className="text-muted-foreground text-center py-8">No attachments found</p>;
              }
              
              return filteredAttachments.map((attachment) => {
                const attachmentSubject = subjects.find(s => s.id === attachment.subject_id);
                return (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <File className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{attachment.title}</span>
                      <Badge variant="secondary">{attachment.category}</Badge>
                      {attachmentSubject && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                          {attachmentSubject.code}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{attachment.file_name}</p>
                    {attachment.linked_modules && attachment.linked_modules.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {attachment.linked_modules.map((link) => (
                          <Badge key={link.module_id} variant="outline" className="text-xs">
                            {link.module_title}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(attachment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(attachment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                );
              });
            })()}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingAttachment} onOpenChange={() => setEditingAttachment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Attachment</DialogTitle>
            <DialogDescription>
              Update attachment details and link to modules
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={editFormData.category}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, category: value })
                }
              >
                <SelectTrigger id="edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tutorial & Note">Tutorial & Note</SelectItem>
                  <SelectItem value="Prelim & A level">Prelim & A level</SelectItem>
                  <SelectItem value="Revision">Revision</SelectItem>
                  <SelectItem value="WA">WA (Weighted Assessment)</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-subject">Subject (to select modules)</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger id="edit-subject">
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

            {selectedSubject && modules.length > 0 && (
              <div className="space-y-2">
                <Label>Link to Modules (multi-select)</Label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                  {modules.map((module) => (
                    <div key={module.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`module-${module.id}`}
                        checked={editFormData.selectedModuleIds.includes(module.id)}
                        onChange={() => handleModuleToggle(module.id)}
                        className="rounded"
                      />
                      <label
                        htmlFor={`module-${module.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {module.title}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingAttachment(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttachmentManager;
