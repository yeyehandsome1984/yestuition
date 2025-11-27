import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  key_concept: string | null;
  content: string | null;
  subject_id: string;
  subject_code: string;
  subject_title: string;
}

interface SearchInputProps {
  subjectId?: string;
  placeholder?: string;
  className?: string;
}

const SearchInput = ({ subjectId, placeholder = "Search modules...", className }: SearchInputProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchModules = async () => {
      if (!query.trim() || query.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        let queryBuilder = supabase
          .from("modules")
          .select(`
            id,
            title,
            key_concept,
            content,
            subject_id,
            subjects!inner(code, title)
          `)
          .is("deleted_at", null);

        if (subjectId) {
          queryBuilder = queryBuilder.eq("subject_id", subjectId);
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;

        // Filter results based on search query
        const searchTerm = query.toLowerCase();
        const filtered = (data || [])
          .map((module: any) => ({
            id: module.id,
            title: module.title,
            key_concept: module.key_concept,
            content: module.content,
            subject_id: module.subject_id,
            subject_code: module.subjects.code,
            subject_title: module.subjects.title,
          }))
          .filter((module) => {
            const titleMatch = module.title.toLowerCase().includes(searchTerm);
            const keyConceptMatch = module.key_concept?.toLowerCase().includes(searchTerm);
            const contentMatch = module.content
              ? stripHtml(module.content).toLowerCase().includes(searchTerm)
              : false;
            return titleMatch || keyConceptMatch || contentMatch;
          })
          .slice(0, 10); // Limit to 10 results

        setResults(filtered);
        setIsOpen(filtered.length > 0);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchModules, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, subjectId]);

  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleResultClick = (moduleId: string) => {
    navigate(`/modules/${moduleId}`);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          className="pl-10 pr-4"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full max-h-[400px] overflow-y-auto bg-popover border rounded-lg shadow-lg z-50">
          <div className="p-2 space-y-1">
            {results.map((result) => (
              <div
                key={result.id}
                onClick={() => handleResultClick(result.id)}
                className="p-3 hover:bg-accent rounded-md cursor-pointer transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className="font-medium">{result.subject_code}</span>
                      <ChevronRight className="h-3 w-3" />
                      <span className="truncate">{result.subject_title}</span>
                    </div>
                    <div className="font-medium text-sm group-hover:text-primary transition-colors">
                      {highlightText(result.title, query)}
                    </div>
                    {result.key_concept && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {highlightText(result.key_concept, query)}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full mt-2 w-full bg-popover border rounded-lg shadow-lg z-50 p-4 text-center text-sm text-muted-foreground">
          No results found
        </div>
      )}
    </div>
  );
};

export default SearchInput;
