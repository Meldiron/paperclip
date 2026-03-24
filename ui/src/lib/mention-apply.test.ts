// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildAgentMentionHref, buildProjectMentionHref } from "@paperclipai/shared";
import { applyMention, mentionMarkdown } from "./mention-apply";
import type { MentionOption } from "../components/MarkdownEditor";

/* ---- fixtures ---- */

const agentOption: MentionOption = {
  id: "agent:agent-123",
  name: "CodexCoder",
  kind: "agent",
  agentId: "agent-123",
  agentIcon: "code",
};

const agentOptionNoIcon: MentionOption = {
  id: "agent:agent-456",
  name: "TestBot",
  kind: "agent",
  agentId: "agent-456",
  agentIcon: null,
};

const projectOption: MentionOption = {
  id: "project-xyz",
  name: "Backend",
  kind: "project",
  projectId: "project-xyz",
  projectColor: "#336699",
};

const projectOptionNoColor: MentionOption = {
  id: "project-abc",
  name: "Frontend",
  kind: "project",
  projectId: "project-abc",
  projectColor: null,
};

/* ---- mentionMarkdown ---- */

describe("mentionMarkdown", () => {
  it("generates a link for an agent with an icon", () => {
    const result = mentionMarkdown(agentOption);
    const expectedHref = buildAgentMentionHref("agent-123", "code");
    expect(result).toBe(`[@CodexCoder](${expectedHref}) `);
  });

  it("generates a link for an agent without an icon", () => {
    const result = mentionMarkdown(agentOptionNoIcon);
    const expectedHref = buildAgentMentionHref("agent-456", null);
    expect(result).toBe(`[@TestBot](${expectedHref}) `);
  });

  it("generates a link for a project with a colour", () => {
    const result = mentionMarkdown(projectOption);
    const expectedHref = buildProjectMentionHref("project-xyz", "#336699");
    expect(result).toBe(`[@Backend](${expectedHref}) `);
  });

  it("generates a link for a project without a colour", () => {
    const result = mentionMarkdown(projectOptionNoColor);
    const expectedHref = buildProjectMentionHref("project-abc", null);
    expect(result).toBe(`[@Frontend](${expectedHref}) `);
  });

  it("falls back to agent behaviour when kind is not 'project'", () => {
    const option: MentionOption = {
      id: "agent:agent-789",
      name: "Rover",
      kind: "agent",
      agentId: "agent-789",
    };
    const result = mentionMarkdown(option);
    expect(result).toContain("[@Rover]");
    expect(result).toContain("agent://");
    expect(result.endsWith(" ")).toBe(true);
  });

  it("strips the agent: prefix when agentId is absent", () => {
    const option: MentionOption = {
      id: "agent:agent-strip",
      name: "Stripper",
      kind: "agent",
    };
    const result = mentionMarkdown(option);
    const expectedHref = buildAgentMentionHref("agent-strip", null);
    expect(result).toBe(`[@Stripper](${expectedHref}) `);
  });
});

/* ---- applyMention ---- */

describe("applyMention", () => {
  it("replaces @query with the mention markdown", () => {
    const markdown = "Hello @world";
    const result = applyMention(markdown, "world", agentOption);
    const chip = mentionMarkdown(agentOption);
    expect(result).toBe(`Hello ${chip}`);
  });

  it("replaces an empty query (bare @)", () => {
    const markdown = "Start @";
    const result = applyMention(markdown, "", agentOption);
    const chip = mentionMarkdown(agentOption);
    expect(result).toBe(`Start ${chip}`);
  });

  it("replaces the LAST occurrence when query appears multiple times", () => {
    const markdown = "Say @hello then @hello";
    const result = applyMention(markdown, "hello", agentOption);
    const chip = mentionMarkdown(agentOption);
    // Only the last @hello is replaced
    expect(result).toBe(`Say @hello then ${chip}`);
  });

  it("returns the markdown unchanged when the query is not found", () => {
    const markdown = "No mention here";
    const result = applyMention(markdown, "hello", agentOption);
    expect(result).toBe(markdown);
  });

  it("works when @query is at the beginning of the string", () => {
    const markdown = "@hello world";
    const result = applyMention(markdown, "hello", agentOption);
    const chip = mentionMarkdown(agentOption);
    // chip ends with a space; the original markdown also has a space before
    // "world", so the result has the chip's trailing space then " world".
    expect(result).toBe(`${chip} world`);
  });

  it("works with a project option", () => {
    const markdown = "See @backend for details";
    const result = applyMention(markdown, "backend", projectOption);
    const chip = mentionMarkdown(projectOption);
    // chip ends with a space; original markdown has " for details" after the query
    expect(result).toBe(`See ${chip} for details`);
  });

  it("preserves trailing content after the query", () => {
    const markdown = "Hello @world, how are you?";
    const result = applyMention(markdown, "world", agentOption);
    const chip = mentionMarkdown(agentOption);
    expect(result).toBe(`Hello ${chip}, how are you?`);
  });

  it("handles a query with a trailing newline in the markdown", () => {
    const markdown = "@hello\n";
    const result = applyMention(markdown, "hello", agentOption);
    const chip = mentionMarkdown(agentOption);
    expect(result).toBe(`${chip}\n`);
  });

  it("is case-sensitive: does not replace if case differs", () => {
    const markdown = "Say @Hello";
    // query is lowercase "hello" but markdown has uppercase "Hello"
    const result = applyMention(markdown, "hello", agentOption);
    // @hello not found → unchanged
    expect(result).toBe(markdown);
  });
});
