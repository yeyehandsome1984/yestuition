import { BookOpen, FileText, Users, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/Navigation";
import SubjectCard from "@/components/SubjectCard";
import FeatureCard from "@/components/FeatureCard";

const Index = () => {
  const subjects = [
    {
      id: "poa",
      title: "Principles of Accounting",
      code: "POA",
      description: "Master the fundamentals of accounting with comprehensive modules covering the accounting equation, double-entry bookkeeping, and financial statements.",
      moduleCount: 12,
      icon: "📊"
    },
    {
      id: "mob",
      title: "Management of Business",
      code: "MOB",
      description: "Learn essential business management concepts including organizational structures, marketing strategies, and business operations.",
      moduleCount: 10,
      icon: "💼"
    }
  ];

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
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              叶 Tuition Hub
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto">
              Your comprehensive platform for Principles of Accounting and Management of Business
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                size="lg" 
                variant="secondary" 
                className="min-w-[200px]"
                onClick={() => window.location.href = '/subjects'}
              >
                Start Learning
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="min-w-[200px] bg-white/10 hover:bg-white/20 border-white/30 text-white hover:text-white"
                onClick={() => window.location.href = '/subjects'}
              >
                View Subjects
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 px-4 border-b">
        <div className="container mx-auto max-w-6xl">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input 
              placeholder="Search modules, topics, or past papers..." 
              className="pl-10 h-12 text-base"
            />
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
          
          <div className="grid md:grid-cols-2 gap-6">
            {subjects.map((subject) => (
              <SubjectCard key={subject.id} {...subject} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-secondary/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose 叶 Tuition Hub?
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
          <p>&copy; 2024 叶 Tuition Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
