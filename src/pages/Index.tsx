import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, FileText, Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";
import SubjectCard from "@/components/SubjectCard";
import FeatureCard from "@/components/FeatureCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Subject {
  id: string;
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  moduleCount: number;
}

const Index = () => {
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
      navigate('/auth');
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .is("deleted_at", null)
        .order("code");

      if (subjectsError) throw subjectsError;

      const subjectsWithModules = await Promise.all(
        (subjectsData || []).map(async (subject) => {
          const { count } = await supabase
            .from("modules")
            .select("*", { count: "exact", head: true })
            .eq("subject_id", subject.id)
            .is("parent_id", null)
            .is("deleted_at", null);

          return {
            ...subject,
            moduleCount: count || 0,
          };
        })
      );

      setSubjects(subjectsWithModules);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: BookOpen,
      title: "Structured Learning",
      description: "Content organized in clear modules and submodules for progressive learning"
    },
    {
      icon: FileText,
      title: "Past Paper Examples",
      description: "Access worked solutions from previous examination papers"
    },
    {
      icon: Download,
      title: "Downloadable Resources",
      description: "Download PDFs and study materials for offline access"
    },
    {
      icon: Users,
      title: "Expert Content",
      description: "Content created and curated by experienced educators"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-primary-foreground py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight flex justify-center items-center gap-1">
              <span>Ye（叶）S（帅）Tuition</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto">
              Your comprehensive platform for Principles of Accounting and Management of Business
            </p>
          </div>
        </div>
      </section>


      {/* Subjects Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Available Subjects
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose a subject to explore comprehensive study materials
            </p>
          </div>
          
          {loading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {subjects.map((subject) => (
                <div key={subject.id} className="space-y-4">
                  <div
                    onClick={() => navigate(`/subjects/${subject.id}/modules`)}
                    className="cursor-pointer"
                  >
                    <SubjectCard {...subject} />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/subjects/${subject.id}/downloads`)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    View {subject.code} Downloads & Attachments
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-secondary/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose Ye （叶）S （帅）Tuition?
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need for exam success in one place
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-card border-primary/10">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-2">Ready to Excel?</CardTitle>
              <CardDescription className="text-base">
                Subscribe now for unlimited access to all subjects and resources
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="min-w-[180px]">
                Subscribe Now
              </Button>
              <Button size="lg" variant="outline" className="min-w-[180px]">
                Try Free Trial
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-8 px-4 border-t">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground">
          <p>&copy; 2024 Ye （叶）S （帅）Tuition. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
