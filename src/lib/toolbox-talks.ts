import toolboxData from "@/data/toolbox-talks.json";
import { getDocument } from "@/lib/db";
import type {
  SafeWorkDocument,
  ToolboxAuthorityMeta,
  ToolboxCitation,
  ToolboxTalkRecord,
  ToolboxTopic,
} from "@/lib/types";

export const toolboxDisclaimer = toolboxData.disclaimer;
export const toolboxAuthorities =
  toolboxData.authorities as ToolboxAuthorityMeta[];
export const toolboxTopics = toolboxData.topics as ToolboxTopic[];

export function getToolboxTopic(id: string): ToolboxTopic | undefined {
  return toolboxTopics.find((t) => t.id === id);
}

export function getToolboxTopics(ids: string[]): ToolboxTopic[] {
  const set = new Set(ids);
  return toolboxTopics.filter((t) => set.has(t.id));
}

export function toolboxCategories(): string[] {
  return Array.from(new Set(toolboxTopics.map((t) => t.category))).sort();
}

export function searchToolboxTopics(query: string): ToolboxTopic[] {
  const q = query.trim().toLowerCase();
  if (!q) return toolboxTopics;
  return toolboxTopics.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q) ||
      t.talkingPoints.some((p) => p.toLowerCase().includes(q)) ||
      t.citations.some(
        (c) =>
          c.label.toLowerCase().includes(q) ||
          c.authority.toLowerCase().includes(q)
      )
  );
}

export interface GeneratedToolboxTalk {
  title: string;
  summary: string;
  topics: ToolboxTopic[];
  talkingPoints: { topicId: string; topicTitle: string; points: string[] }[];
  discussionPrompts: { topicId: string; topicTitle: string; prompts: string[] }[];
  citations: ToolboxCitation[];
  relatedDocuments: SafeWorkDocument[];
  authoritiesUsed: ToolboxAuthorityMeta[];
}

export function generateToolboxTalk(topicIds: string[]): GeneratedToolboxTalk {
  const topics = getToolboxTopics(topicIds);
  const talkingPoints = topics.map((t) => ({
    topicId: t.id,
    topicTitle: t.title,
    points: t.talkingPoints,
  }));
  const discussionPrompts = topics.map((t) => ({
    topicId: t.id,
    topicTitle: t.title,
    prompts: t.discussionPrompts,
  }));

  const citationKey = (c: ToolboxCitation) =>
    `${c.authority}::${c.label}::${c.url ?? ""}`;
  const citationMap = new Map<string, ToolboxCitation>();
  for (const t of topics) {
    for (const c of t.citations) {
      citationMap.set(citationKey(c), c);
    }
  }
  const citations = Array.from(citationMap.values()).sort((a, b) =>
    a.authority.localeCompare(b.authority) || a.label.localeCompare(b.label)
  );

  const authorityNames = new Set(citations.map((c) => c.authority));
  const authoritiesUsed = toolboxAuthorities.filter((a) =>
    authorityNames.has(a.name as ToolboxCitation["authority"])
  );

  const docIds = Array.from(
    new Set(topics.flatMap((t) => t.relatedDocumentIds ?? []))
  );
  const relatedDocuments = docIds
    .map((id) => getDocument(id))
    .filter((d): d is SafeWorkDocument => Boolean(d));

  const title =
    topics.length === 0
      ? "Toolbox talk"
      : topics.length === 1
        ? `Toolbox — ${topics[0].title}`
        : `Toolbox — ${topics.length} topics`;

  const summary =
    topics.length === 0
      ? "Select topics to build today’s toolbox talk."
      : topics.map((t) => t.summary).join(" ");

  return {
    title,
    summary,
    topics,
    talkingPoints,
    discussionPrompts,
    citations,
    relatedDocuments,
    authoritiesUsed,
  };
}

export function createToolboxTalkId(): string {
  return `tbt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function seedToolboxTalks(): ToolboxTalkRecord[] {
  const generated = generateToolboxTalk(["tbt-blind-lift", "tbt-swing-radius"]);
  return [
    {
      id: "tbt-seed-1",
      topicIds: ["tbt-blind-lift", "tbt-swing-radius"],
      title: generated.title,
      projectId: "proj-oceanview",
      deliveredAt: new Date().toISOString(),
      facilitatorName: "Dave Okonkwo",
      attendeeMemberIds: ["m-chen", "m-lee", "m-nguyen", "m-kim"],
      notes: "Morning brief before first blind pick on Level 28.",
      generatedSummary: generated.summary,
    },
  ];
}
