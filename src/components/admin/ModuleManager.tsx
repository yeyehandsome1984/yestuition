import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

interface Subject {
  id: string;
  code: string;
  title: string;
}

interface Module {
  id: string;
  subject_id: string;
  parent_id: string | null;
  title: string;
  description: string | null;
  content: string | null;
  order_index: number | null;
  subjects?: { code: string; title: string };
}

const ModuleManager = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState({
    subject_id: "",
    parent_id: "",
    title: "",
    description: "",
    content: "",
    order_index: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subjectsRes, modulesRes] = await Promise.all([
        supabase.from("subjects").select("id, code, title").order("code"),
        supabase.from("modules").select("*").order("order_index"),
      ]);

      if (subjectsRes.error) throw subjectsRes.error;
      if (modulesRes.error) throw modulesRes.error;

      setSubjects(subjectsRes.data || []);
      setModules(modulesRes.data || []);
    } catch (error) {
      console.error("Failed to load subjects/modules", error);
      toast.error("Failed to load subjects or modules");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject_id) {
      toast.error("Please select a subject");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    const moduleData = {
      subject_id: formData.subject_id,
      parent_id: formData.parent_id || null,
      title: formData.title,
      description: formData.description || null,
      content: formData.content || null,
      order_index: formData.order_index
    };

    if (editingModule) {
      const { error } = await supabase
        .from("modules")
        .update(moduleData)
        .eq("id", editingModule.id);

      if (error) {
        toast.error("Failed to update module");
        return;
      }
      toast.success("Module updated successfully");
    } else {
      const { error } = await supabase
        .from("modules")
        .insert([moduleData]);

      if (error) {
        toast.error("Failed to create module");
        return;
      }
      toast.success("Module created successfully");
    }

    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleEdit = (module: Module) => {
    setEditingModule(module);
    setFormData({
      subject_id: module.subject_id,
      parent_id: module.parent_id || "",
      title: module.title,
      description: module.description || "",
      content: module.content || "",
      order_index: module.order_index || 0
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this module? All submodules will also be deleted.")) {
      return;
    }

    const { error } = await supabase
      .from("modules")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete module");
      return;
    }

    toast.success("Module deleted successfully");
    fetchData();
  };

  const resetForm = () => {
    setEditingModule(null);
    setFormData({
      subject_id: "",
      parent_id: "",
      title: "",
      description: "",
      content: "",
      order_index: 0
    });
  };

  const handleDialogChange = (open: boolean) => {
    console.log("ModuleManager dialog change", { open, formData, editingModule });
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };
  
  const parentModules = Array.isArray(modules) ? modules.filter((m) => !m.parent_id) : [];

  if (loading) {
    return <div className="text-center py-8">Loading modules...</div>;
  }

  return (
    <div className="space-y-4">
      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingModule ? "Edit Module" : "Create New Module"}</DialogTitle>
            <DialogDescription>
              {editingModule ? "Update module information" : "Add a new module or submodule"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select
                  value={formData.subject_id}
                  onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
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
                <Label htmlFor="parent">Parent Module (optional)</Label>
                <Select
                  value={formData.parent_id}
                  onValueChange={(value) => setFormData({ ...formData, parent_id: value })}
                >
                  <SelectTrigger id="parent">
                    <SelectValue placeholder="None (top-level module)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (top-level module)</SelectItem>
                    {parentModules
                      .filter(m => m.subject_id === formData.subject_id)
                      .map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Chapter 1: Introduction"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the module"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Module content (supports HTML)"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Order Index</Label>
                <Input
                  id="order"
                  type="number"
                  placeholder="0"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingModule ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No modules found. Create your first module!
                </TableCell>
              </TableRow>
            ) : (
              modules.map((module) => (
                <TableRow key={module.id}>
                  <TableCell className="font-medium">
                    {subjects.find((s) => s.id === module.subject_id)?.code}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {module.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={module.parent_id ? "text-muted-foreground" : "font-medium"}>
                      {module.parent_id ? "Submodule" : "Module"}
                    </span>
                  </TableCell>
                  <TableCell>{module.order_index}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(module)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(module.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ModuleManager;
