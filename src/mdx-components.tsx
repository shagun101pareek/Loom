import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="text-4xl font-semibold tracking-tight">{children}</h1>
    ),
    p: ({ children }) => (
      <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        {children}
      </p>
    ),
    ...components,
  };
}
