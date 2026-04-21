import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

export interface LatexTextProps {
  value: string | null | undefined;
  inline?: boolean;
  className?: string;
}

function isLikelyLatex(input: string): boolean {
  // Heuristic: contains common LaTeX tokens or commands
  return /\\[a-zA-Z]+|[\\{}^_]|\\frac|\\sqrt|\\pi|\\infty|\\leq|\\geq/.test(
    input
  );
}

export const LatexText: React.FC<LatexTextProps> = ({
  value,
  inline = true,
  className = "",
}) => {
  const text = (value ?? "").trim();
  if (!text) return <span className={className} />;

  if (!isLikelyLatex(text)) {
    return <span className={className}>{text}</span>;
  }

  try {
    const html = katex.renderToString(text, {
      throwOnError: false,
      displayMode: !inline,
      strict: "ignore",
    });
    return (
      <span
        className={`${className} [&_.katex]:text-base [&_.katex]:sm:text-lg [&_.katex]:md:text-xl [&_.katex]:lg:text-2xl [&_.katex]:xl:text-3xl`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return <span className={className}>{text}</span>;
  }
};

export default LatexText;