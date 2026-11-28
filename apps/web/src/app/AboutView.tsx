const SECTIONS = [
  {
    heading: 'What SignalDesk does',
    body: 'It helps a person find public discussions where people ask general questions about insurance, understand why each one matched, and write a helpful reply that a human reviews before using anywhere else.',
  },
  {
    heading: 'What it never does',
    body: 'It never sends, posts, emails or messages anything. It does not profile people, collect contact details, or score anyone. Discussions that mention bereavement, pregnancy, health or money trouble are blocked from drafting.',
  },
  {
    heading: 'How matching works',
    body: 'Matching is plain keyword overlap, and every word you search for must appear in the text or tags. A match means the topic is relevant. It is not an AI score and says nothing about the person who wrote the post.',
  },
  {
    heading: 'About the data',
    body: 'Demo mode uses entirely fictional discussions written for this project. They do not represent real people or live social listening. Live posts are never stored.',
  },
];

export function AboutView() {
  return (
    <div className="max-w-2xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <h1 className="text-xl font-semibold tracking-tight">About SignalDesk</h1>
      <div className="mt-6 space-y-6">
        {SECTIONS.map(({ heading, body }) => (
          <section key={heading}>
            <h2 className="text-sm font-medium">{heading}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
