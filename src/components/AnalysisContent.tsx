'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

const components: Components = {
  h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{children}</h1>,
  h2: ({ children }) => (
    <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3 pb-2 border-b border-gray-100 flex items-center gap-2">
      {children}
    </h2>
  ),
  h3: ({ children }) => <h3 className="text-base font-semibold text-gray-800 mt-6 mb-2">{children}</h3>,
  h4: ({ children }) => <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-1">{children}</h4>,
  p:  ({ children }) => <p className="text-gray-700 leading-relaxed mb-4">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 space-y-1.5 pl-4">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 space-y-1.5 pl-4 list-decimal">{children}</ol>,
  li: ({ children }) => (
    <li className="text-gray-700 leading-relaxed flex items-start gap-2">
      <span className="text-indigo-400 mt-1.5 text-xs shrink-0">●</span>
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  em:     ({ children }) => <em className="italic text-gray-600">{children}</em>,
  hr:     () => <hr className="my-8 border-gray-200" />,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-indigo-300 pl-4 my-4 text-gray-600 italic bg-indigo-50/30 py-2 pr-3 rounded-r-lg">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.startsWith('language-');
    if (isBlock) {
      return (
        <code className="block bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-sm font-mono text-gray-800 overflow-x-auto whitespace-pre">
          {children}
        </code>
      );
    }
    return <code className="bg-gray-100 text-indigo-700 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
  },
  table: ({ children }) => (
    <div className="overflow-x-auto mb-6 rounded-lg border border-gray-200">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-indigo-50">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-gray-200 px-4 py-2.5 text-left font-semibold text-indigo-900 text-xs uppercase tracking-wide">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border-b border-gray-100 px-4 py-2.5 text-gray-700">{children}</td>,
  input: ({ type, checked }) =>
    type === 'checkbox' ? (
      <input
        type="checkbox"
        defaultChecked={checked}
        className="rounded border-gray-300 text-indigo-600 mr-2"
        readOnly
      />
    ) : null,
};

export function AnalysisContent({ content, streaming }: { content: string; streaming?: boolean }) {
  return (
    <div className={`relative ${streaming ? 'streaming-cursor' : ''}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
