import { useState } from 'react';
import { Sidebar, type View } from '../components/Sidebar';
import { DiscussionsView } from '../features/discussions/DiscussionsView';
import { AboutView } from './AboutView';

export function App() {
  const [view, setView] = useState<View>('discussions');

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[14.5rem_1fr]">
      <Sidebar current={view} onNavigate={setView} />
      <main>
        {/* Hidden, not unmounted: switching pages must not wipe search results or unsaved edits. */}
        <div hidden={view !== 'discussions'}>
          <DiscussionsView />
        </div>
        <div hidden={view !== 'about'}>
          <AboutView />
        </div>
      </main>
    </div>
  );
}
