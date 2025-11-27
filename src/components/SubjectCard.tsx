import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, BookOpen } from "lucide-react";

interface SubjectCardProps {
  id: string;
  title: string;
  code: string;
  description: string;
  moduleCount: number;
  icon: string;
}

const SubjectCard = ({ title, code, description, moduleCount, icon }: SubjectCardProps) => {
  return (
    <Card className="group hover:shadow-hover transition-all duration-300 cursor-pointer bg-gradient-card border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{icon}</span>
              <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                {title}
              </CardTitle>
            </div>
            <CardDescription className="text-sm font-medium text-primary/70">
              {code}
            </CardDescription>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            <span>{moduleCount} Modules</span>
          </div>
          <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            Explore
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectCard;
