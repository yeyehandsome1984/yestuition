import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "./RichTextEditor";
import { Maximize2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  key_concept: string | null;
  prelim_year_tested: string | null;
  a_level_year_tested: string | null;
  content: string | null;
  order_index: number | null;
  subjects?: { code: string; title: string };
}

const ModuleManager = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>("");
  const [filterName, setFilterName] = useState<string>("");
  const [formData, setFormData] = useState({
    subject_id: "",
    parent_id: "__none", // internal sentinel for no parent
    title: "",
    key_concept: "",
    prelim_year_tested: "",
    a_level_year_tested: "",
    content: "",
    order_index: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subjectsRes, modulesRes] = await Promise.all([
        supabase.from("subjects").select("id, code, title").is("deleted_at", null).order("code"),
        supabase.from("modules").select("*").is("deleted_at", null).order("order_index"),
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
      parent_id: formData.parent_id === "__none" ? null : formData.parent_id,
      title: formData.title,
      key_concept: formData.key_concept || null,
      prelim_year_tested: formData.prelim_year_tested || null,
      a_level_year_tested: formData.a_level_year_tested || null,
      content: formData.content || null,
      order_index: formData.order_index,
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
      parent_id: module.parent_id ?? "__none",
      title: module.title,
      key_concept: module.key_concept || "",
      prelim_year_tested: module.prelim_year_tested || "",
      a_level_year_tested: module.a_level_year_tested || "",
      content: module.content || "",
      order_index: module.order_index || 0,
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setModuleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!moduleToDelete) return;

    const { error } = await supabase
      .from("modules")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", moduleToDelete);

    if (error) {
      toast.error("Failed to delete module");
      return;
    }

    toast.success("Module deleted successfully");
    setDeleteDialogOpen(false);
    setModuleToDelete(null);
    fetchData();
  };

  const resetForm = () => {
    setEditingModule(null);
    setFormData({
      subject_id: "",
      parent_id: "__none",
      title: "",
      key_concept: "",
      prelim_year_tested: "",
      a_level_year_tested: "",
      content: "",
      order_index: 0,
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

  // Filter modules based on subject and name (independently)
  const filteredModules = modules.filter((module) => {
    const effectiveSubject = filterSubject === "__all" ? "" : filterSubject;
    const matchesSubject = !effectiveSubject || module.subject_id === effectiveSubject;
    const matchesName = !filterName || module.title.toLowerCase().includes(filterName.toLowerCase());
    return matchesSubject && matchesName;
  });

  if (loading) {
    return <div className="text-center py-8">Loading modules...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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
                    <SelectItem value="__none">None (top-level module)</SelectItem>
                    {parentModules
                      .filter((m) => m.subject_id === formData.subject_id)
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
                <Label htmlFor="key_concept">Key concept</Label>
                <Textarea
                  id="key_concept"
                  placeholder="Brief description of key concepts in the module"
                  value={formData.key_concept}
                  onChange={(e) => setFormData({ ...formData, key_concept: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prelim_year_tested">Prelim Year Tested</Label>
                <Input
                  id="prelim_year_tested"
                  placeholder="e.g., 2020, 2021, Paper 1"
                  value={formData.prelim_year_tested}
                  onChange={(e) => setFormData({ ...formData, prelim_year_tested: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="a_level_year_tested">A Level Year Tested</Label>
                <Input
                  id="a_level_year_tested"
                  placeholder="e.g., 2022, 2023, Paper 2"
                  value={formData.a_level_year_tested}
                  onChange={(e) => setFormData({ ...formData, a_level_year_tested: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Content</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setContentDialogOpen(true)}
                  >
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Edit in Full Screen
                  </Button>
                </div>
                <Textarea
                  id="content"
                  placeholder="Click 'Edit in Full Screen' for rich text editing"
                  value={formData.content.replace(/<[^>]*>/g, '')}
                  rows={3}
                  readOnly
                  className="cursor-pointer"
                  onClick={() => setContentDialogOpen(true)}
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

        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-full sm:w-[180px]">
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

        <Input
          placeholder="Search by module name..."
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className="w-full sm:w-[220px]"
        />
      </div>

      <Dialog open={contentDialogOpen} onOpenChange={setContentDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
            <DialogDescription>
              Use the rich text editor to format your content
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RichTextEditor
              content={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
            />
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setContentDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
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
            {filteredModules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {modules.length === 0 ? "No modules found. Create your first module!" : "No modules match your filters."}
                </TableCell>
              </TableRow>
            ) : (
              filteredModules.map((module) => (
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
                        onClick={() => handleDeleteClick(module.id)}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Module
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to delete the module: <strong className="text-foreground">
                  {modules.find(m => m.id === moduleToDelete)?.title}
                </strong>
              </p>
              <p>
                This will archive the module and hide it from view. Any submodules will also be affected.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setModuleToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Module
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ModuleManager;
