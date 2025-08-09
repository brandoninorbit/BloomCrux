import React from "react";
import { cn } from "@/lib/utils";

export interface CodeSnippetProps {
  code: string;
  language?: string;  // e.g., "ts", "js", "python"
  className?: string;
}

export const CodeSnippet: React.FC<CodeSnippetProps> = ({ code, language = "txt", className }) => {
  return (
    <pre className={cn("rounded-md bg-muted p-4 overflow-x-auto text-sm", className)}>
      <code data-language={language}>
        {code}
      </code>
    </pre>
  );
};


