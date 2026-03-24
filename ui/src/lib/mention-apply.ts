import { buildAgentMentionHref, buildProjectMentionHref } from "@paperclipai/shared";
import type { MentionOption } from "../components/MarkdownEditor";

/**
 * Generate the markdown snippet for a selected mention option.
 * Returns a link with a trailing space so the cursor lands after the chip.
 */
export function mentionMarkdown(option: MentionOption): string {
  if (option.kind === "project" && option.projectId) {
    return `[@${option.name}](${buildProjectMentionHref(option.projectId, option.projectColor ?? null)}) `;
  }
  const agentId = option.agentId ?? option.id.replace(/^agent:/, "");
  return `[@${option.name}](${buildAgentMentionHref(agentId, option.agentIcon ?? null)}) `;
}

/**
 * Replace the last `@<query>` occurrence in the markdown string with the
 * selected mention token.  Returns the original string unchanged when the
 * query cannot be found (e.g. the editor content changed underneath us).
 */
export function applyMention(markdown: string, query: string, option: MentionOption): string {
  const search = `@${query}`;
  const replacement = mentionMarkdown(option);
  const idx = markdown.lastIndexOf(search);
  if (idx === -1) return markdown;
  return markdown.slice(0, idx) + replacement + markdown.slice(idx + search.length);
}
