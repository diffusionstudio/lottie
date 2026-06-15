import { Show } from 'solid-js';
import { SidebarLeft } from '@/components/sidebar-left';
import { PlaybackControls } from '@/components/playback-controls';
import { ScenesContainer } from '@/components/scenes-container';
import { SidebarRight } from '@/components/sidebar-right';
import { useUI } from '@/context/ui';

export function App() {
  const { controlsExpanded } = useUI();

  return (
    <>
      <SidebarLeft />
      <div class="absolute inset-x-0 bottom-4 flex flex-col items-center gap-4 px-4">
        <PlaybackControls />
        <Show when={controlsExpanded()}>
          <ScenesContainer />
        </Show>
      </div>
      <SidebarRight />
    </>
  );
};
