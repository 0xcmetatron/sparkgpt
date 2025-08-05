import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownMessageProps {
  content: string
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose prose-invert max-w-none
                 prose-headings:text-chatgpt-text-primary prose-headings:font-semibold prose-headings:mb-2
                 prose-p:text-chatgpt-text-primary prose-p:leading-relaxed prose-p:mb-4
                 prose-ul:mb-4 prose-ol:mb-4 prose-li:mb-1 prose-li:text-chatgpt-text-primary prose-li:leading-relaxed
                 prose-strong:text-chatgpt-accent-blue prose-em:text-chatgpt-text-secondary
                 prose-code:bg-chatgpt-input-bg prose-code:text-chatgpt-accent-blue prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
                 prose-pre:bg-chatgpt-input-bg prose-pre:text-chatgpt-text-primary prose-pre:p-3 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:mb-2
                 prose-blockquote:border-l-4 prose-blockquote:border-chatgpt-accent-blue prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-chatgpt-text-secondary prose-blockquote:mb-2
                 prose-a:text-chatgpt-accent-blue hover:prose-a:text-blue-300 prose-a:underline"
      components={{
        // Custom styling for markdown elements
        h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-md font-medium mb-1">{children}</h3>,
        p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-bold text-chatgpt-accent-blue">{children}</strong>,
        em: ({ children }) => <em className="italic text-chatgpt-text-secondary">{children}</em>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2 pl-4">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2 pl-4">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        code: ({ children, className }) => {
          const isInline = !className
          if (isInline) {
            return (
              <code className="bg-chatgpt-input-bg text-chatgpt-accent-blue px-1 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            )
          }
          return (
            <pre className="bg-chatgpt-input-bg text-chatgpt-text-primary p-3 rounded-lg overflow-x-auto mb-2">
              <code className={className}>{children}</code>
            </pre>
          )
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-chatgpt-accent-blue pl-4 italic text-chatgpt-text-secondary mb-2">
            {children}
          </blockquote>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-chatgpt-accent-blue hover:text-blue-300 underline"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
