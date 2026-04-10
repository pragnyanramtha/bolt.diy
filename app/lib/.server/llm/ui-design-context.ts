/**
 * UI-UX Pro Max Design System Tool
 *
 * Exposes the UI-UX Pro Max API as a Vercel AI SDK tool so bolt.diy's LLM
 * can call it autonomously when it determines the user wants UI work.
 *
 * The LLM decides WHEN to call it and provides the right keywords itself —
 * no regex heuristics needed.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ui-design-tool');

const UI_UX_API = 'https://ui-ux-pro-max-api.vercel.app';

async function fetchFromApi(path: string, params: Record<string, string>): Promise<string> {
  const qs = new URLSearchParams({ ...params, format: 'markdown' }).toString();
  const url = `${UI_UX_API}${path}?${qs}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`UI-UX API error: ${response.status} for ${url}`);
  }

  return response.text();
}

/**
 * Tool: fetch_design_system
 *
 * Fetches a complete, opinionated design system (colors, typography, layout pattern,
 * effects, anti-patterns) from the UI-UX Pro Max API.
 *
 * The LLM should call this BEFORE writing any CSS, Tailwind config, or component styles.
 */
export const fetchDesignSystemTool = tool({
  description: `Fetch a complete UI design system for the current project from the UI-UX Pro Max API.
Call this tool FIRST before writing any UI code, color values, fonts, or layout styles.
The API returns exact hex colors, font pairings, layout patterns, key effects, and anti-patterns to avoid.
You MUST use the returned values — do not invent your own colors or fonts.

Available domains for search: style, color, typography, landing, product, ux, chart, icons, react, web.
Available stacks: react, nextjs, vue, svelte, html-tailwind, shadcn, react-native, flutter, angular.`,
  parameters: z.object({
    query: z
      .string()
      .describe(
        'Design keywords describing the product type, industry, and style. Be specific. ' +
          'Examples: "saas analytics dashboard dark modern", "beauty wellness spa elegant minimal", ' +
          '"fintech crypto trading dark glassmorphism", "ecommerce fashion store luxury"',
      ),
    projectName: z
      .string()
      .optional()
      .describe('The project name. Infer this from the user request if possible.'),
  }),
  execute: async ({ query, projectName }) => {
    logger.info(`Fetching design system: query="${query}" project="${projectName ?? 'unset'}"`);

    try {
      const params: Record<string, string> = { q: query };

      if (projectName) {
        params.project_name = projectName;
      }

      const result = await fetchFromApi('/design-system', params);
      logger.info('Design system fetched successfully');

      return result;
    } catch (err: any) {
      logger.error(`Design system fetch failed: ${err.message}`);
      return `Error fetching design system: ${err.message}. Proceed with a sensible default design.`;
    }
  },
});

/**
 * Tool: search_design_patterns
 *
 * Searches a specific design domain for additional guidance.
 * Use after fetch_design_system for deeper detail on specific topics.
 */
export const searchDesignPatternsTool = tool({
  description: `Search a specific UI/UX domain for additional design guidance.
Use this AFTER fetch_design_system when you need deeper detail on a specific topic.

Domains:
- style: UI styles, visual effects (glassmorphism, minimalism, brutalism, etc.)
- color: Color palettes by product type (saas, fintech, healthcare, beauty, etc.)
- typography: Font pairings with Google Fonts
- landing: Landing page patterns and conversion optimization
- product: Product type recommendations
- ux: UX best practices and anti-patterns
- chart: Chart type recommendations
- icons: Icon library recommendations
- react: React/Next.js performance patterns
- web: Web accessibility and semantic HTML guidelines`,
  parameters: z.object({
    domain: z
      .enum(['style', 'color', 'typography', 'landing', 'product', 'ux', 'chart', 'icons', 'react', 'web'])
      .describe('The domain to search'),
    query: z.string().describe('What to search for within this domain'),
    maxResults: z.number().optional().default(3).describe('Maximum number of results (default: 3)'),
  }),
  execute: async ({ domain, query, maxResults }) => {
    logger.info(`Searching design domain "${domain}": query="${query}"`);

    try {
      const result = await fetchFromApi(`/search/${domain}`, {
        q: query,
        n: String(maxResults ?? 3),
      });
      return result;
    } catch (err: any) {
      logger.error(`Design search failed: ${err.message}`);
      return `Error searching ${domain}: ${err.message}`;
    }
  },
});

/**
 * Tool: get_stack_guidelines
 *
 * Fetches stack-specific implementation guidelines (React, Next.js, Tailwind, etc.)
 */
export const getStackGuidelinesTool = tool({
  description: `Fetch implementation-specific best practices for a given tech stack.
Use this when you need stack-specific guidance (e.g., how to structure Tailwind config, React patterns, etc.)

Available stacks: react, nextjs, vue, svelte, html-tailwind, shadcn, react-native, flutter, angular, laravel`,
  parameters: z.object({
    stack: z
      .enum([
        'react',
        'nextjs',
        'vue',
        'svelte',
        'html-tailwind',
        'shadcn',
        'react-native',
        'flutter',
        'angular',
        'laravel',
      ])
      .describe('The tech stack to get guidelines for'),
    query: z.string().describe('What aspect of the stack to get guidance on'),
  }),
  execute: async ({ stack, query }) => {
    logger.info(`Fetching stack guidelines: stack="${stack}" query="${query}"`);

    try {
      const result = await fetchFromApi(`/search/stack/${stack}`, { q: query });
      return result;
    } catch (err: any) {
      logger.error(`Stack guidelines fetch failed: ${err.message}`);
      return `Error fetching ${stack} guidelines: ${err.message}`;
    }
  },
});

/** All UI-UX Pro Max tools, ready to spread into streamText options */
export const uiUxProMaxTools = {
  fetch_design_system: fetchDesignSystemTool,
  search_design_patterns: searchDesignPatternsTool,
  get_stack_guidelines: getStackGuidelinesTool,
};
