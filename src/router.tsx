import { A, Navigate, Route, Router, useParams } from "@solidjs/router";
import { createMemo, Show, type JSX } from "solid-js";
import { CenteredContainer } from "@/components/ui/container";
import { App } from "./app";
import { CanvasProvider } from "./context/canvas";
import { ScenesProvider, useScenes } from "./context/scenes";

function Providers(props: { children?: JSX.Element }) {
  return (
    <ScenesProvider>
      <CanvasProvider>
        {props.children}
      </CanvasProvider>
    </ScenesProvider>
  );
}

function RedirectToDefault() {
  const { defaultScene, ready } = useScenes();
  return (
    <Show when={ready()} fallback={<CenteredContainer>Loading scenes…</CenteredContainer>}>
      <Show when={defaultScene()} fallback={<CenteredContainer>No projects found in public/projects.</CenteredContainer>}>
        {(target) => <Navigate href={`/${target().project.slug}/${target().scene.slug}`} />}
      </Show>
    </Show>
  );
}

function NotFound() {
  return (
    <CenteredContainer>
      <div class="flex flex-col items-center gap-2">
        <span>Project or scene not found.</span>
        <A href="/" class="text-foreground underline">
          Back to projects
        </A>
      </div>
    </CenteredContainer>
  );
}

function SceneRoute() {
  const params = useParams();
  const { findScene, ready } = useScenes();

  const isSceneAvailable = createMemo(() => {
    return params.project && params.scene && findScene(params.project, params.scene);
  });

  return (
    <Show when={ready()} fallback={<CenteredContainer>Loading scenes…</CenteredContainer>}>
      <Show when={isSceneAvailable()} fallback={<NotFound />}>
        <App />
      </Show>
    </Show>
  );
}

export function Root() {
  return (
    <Router root={Providers}>
      <Route path="/" component={RedirectToDefault} />
      <Route path="/:project/:scene" component={SceneRoute} />
      <Route path="*" component={NotFound} />
    </Router>
  );
}
