import type { Tone } from '../../schemas/draft.schema.js';
import type { Discussion } from '../../types/discussion.js';
import type { ModelDraft } from '../../schemas/draft.schema.js';

const TEMPLATES: Record<Tone, (topic: string) => string> = {
  friendly: (topic) =>
    `Good question about ${topic}. In general the details vary by insurer and policy, so the plain-language documents your insurer provides are a good place to start. A licensed professional can answer questions about a specific situation. Happy to point to general resources if that would help.`,
  professional: (topic) =>
    `Thank you for raising ${topic}. The specifics differ between insurers and policies, so the policy documents are the authoritative source. For questions about a particular case, a licensed professional can provide guidance. General educational resources may also help clarify the terminology.`,
  empathetic: (topic) =>
    `Questions about ${topic} can feel confusing, and it is sensible to want to understand the basics first. Terms differ between insurers and policies, so the policy documents are a good starting point, and a licensed professional can help with anything specific. Take your time with it.`,
};

/** Deterministic fallback used when no AI key is configured or the AI provider fails. */
export function generateTemplateDraft(discussion: Discussion, tone: Tone): ModelDraft {
  const topics = discussion.tags.filter((tag) => tag !== 'education').slice(0, 2);
  const topic = topics.length > 0 ? topics.join(' and ') : 'insurance';

  return {
    suggestedReply: TEMPLATES[tone](topic),
    approach:
      'Template draft, not AI-generated: it names the topic, makes no product claims, and points to policy documents and licensed professionals.',
    safetyWarning: '',
  };
}
