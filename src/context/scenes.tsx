import { createContext, createResource, useContext, type JSX } from "solid-js";
import type { ScenesTree, Project, Scene } from "@/types";

// Dev: the scenes-discovery plugin serves a live tree at /__scenes and pushes
// updates over the HMR socket. Build: the plugin emits a static scenes.json.
const SCENES_URL = import.meta.env.DEV ? "/__scenes" : "/scenes.json";

const ScenesContext = createContext<{
  projects: () => Project[];
  findProject: (slug: string) => Project | undefined;
  findScene: (projectSlug: string, sceneSlug: string) => Scene | undefined;
  defaultScene: () => { project: Project; scene: Scene } | undefined;
  ready: () => boolean;
}>();

async function loadScenes(): Promise<ScenesTree> {
  const res = await fetch(SCENES_URL);
  if (!res.ok) throw new Error(`Failed to load scenes from ${SCENES_URL} (HTTP ${res.status})`);
  return (await res.json()) as ScenesTree;
}

export function ScenesProvider(props: { children: JSX.Element }) {
  const [tree, { mutate }] = createResource(loadScenes);

  // Live-patch the tree when the dev plugin reports filesystem changes.
  import.meta.hot?.on("scenes:update", (next: ScenesTree) => mutate(next));

  const projects = () => tree()?.projects ?? [];
  const findProject = (slug: string) => projects().find((p) => p.slug === slug);
  const findScene = (projectSlug: string, sceneSlug: string) =>
    findProject(projectSlug)?.scenes.find((s) => s.slug === sceneSlug);
  const defaultScene = () => {
    const project = projects()[0];
    const scene = project?.scenes[0];
    return project && scene ? { project, scene } : undefined;
  };
  const ready = () => !tree.loading && tree() != null;

  return (
    <ScenesContext.Provider value={{ projects, findProject, findScene, defaultScene, ready }}>
      {props.children}
    </ScenesContext.Provider>
  );
}

export function useScenes() {
  const context = useContext(ScenesContext);
  if (!context) {
    throw new Error("useScenes must be used within a ScenesProvider");
  }
  return context;
}
