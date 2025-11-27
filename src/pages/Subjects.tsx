import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import SubjectCard from "@/components/SubjectCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Subject {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  moduleCount?: number;
}

const Subjects = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchSubjects();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("code");

      if (error) throw error;
      
      // Fetch module counts for each subject
      const subjectsWithCounts = await Promise.all(
        (data || []).map(async (subject) => {
          const { count } = await supabase
            .from("modules")
            .select("*", { count: "exact", head: true })
            .eq("subject_id", subject.id);
          
          return { ...subject, moduleCount: count || 0 };
        })
      );
      
      setSubjects(subjectsWithCounts);
    } catch (error: any) {
      toast.error("Failed to load subjects");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Browse Subjects
            </h1>
            <p className="text-muted-foreground text-lg">
              Select a subject to explore modules and learning materials
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {loading ? (
              <>
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
              </>
            ) : (
              subjects.map((subject) => (
                <div
                  key={subject.id}
                  onClick={() => navigate(`/subjects/${subject.id}/modules`)}
                >
                  <SubjectCard
                    id={subject.id}
                    title={subject.title}
                    code={subject.code}
                    description={subject.description || ""}
                    moduleCount={subject.moduleCount || 0}
                    icon={subject.icon || "📚"}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Subjects;
