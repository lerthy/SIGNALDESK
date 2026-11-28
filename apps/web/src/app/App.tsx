import { useState } from 'react';
import { Sidebar, type View } from '../components/Sidebar';
import { DiscussionsView } from '../features/discussions/DiscussionsView';
import { DraftLibrary } from '../features/drafts/DraftLibrary';
import { OverviewView } from '../features/overview/OverviewView';
import { AboutView } from './AboutView';

export function App() {
  const [view, setView] = useState<View>('overview');
  // The id changes on every request, which gives DiscussionsView a fresh start with that query.
  const [searchRequest, setSearchRequest] = useState<{ query: string; id: number } | null>(null);

  function openSearch(query: string) {
    setSearchRequest({ query, id: Date.now() });
    setView('discussions');
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[14.5rem_1fr]">
      <Sidebar current={view} onNavigate={setView} />
      <main>
        {/* Overview and Drafts load fresh data each time you open them. */}
        {view === 'overview' && <OverviewView onSearch={openSearch} />}
        {/* Discussions stays mounted, only hidden: leaving it must not wipe results or an unsaved reply. */}
        <div hidden={view !== 'discussions'}>
          <DiscussionsView key={searchRequest?.id} initialQuery={searchRequest?.query} />
        </div>
        {view === 'drafts' && <DraftLibrary />}
        <div hidden={view !== 'about'}>
          <AboutView />
        </div>
      </main>
    </div>
  );
}
