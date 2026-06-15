import { For, Show, createResource } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import { Trash } from "lucide-solid";
import { Icon } from "@/components/ui/icon";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useScenes } from "@/context/scenes";
import { getThumbnail } from "@/lib/thumbnails";
import { Scene } from "@/types";

export function ScenesContainer() {
  const params = useParams();
  const navigate = useNavigate();
  const { findProject } = useScenes();

  const scenes = () => (params.project ? findProject(params.project)?.scenes ?? [] : []);

  const deleteScene = async (scene: Scene) => {
    if (!params.project) return;
    await fetch("/__scenes/scene", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project: params.project, scene: scene.slug }),
    });
    // If the active scene was removed, fall back to another scene in the project
    // (or the default route if none remain). The tree refreshes over HMR.
    if (scene.slug === params.scene) {
      const next = scenes().find((s) => s.slug !== scene.slug);
      navigate(next ? `/${params.project}/${next.slug}` : "/");
    }
  };

  const addScene = async () => {
    if (!params.project) return;
    const res = await fetch("/__scenes/scene", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project: params.project }),
    });
    const { project, scene } = (await res.json()) as { project: string; scene: string };
    navigate(`/${project}/${scene}`);
  };

  return (
    <div class="flex items-start justify-center gap-4">
      <For each={scenes()}>
        {(scene) => (
          <SceneItem
            scene={scene}
            active={scene.slug === params.scene}
            onDelete={() => deleteScene(scene)}
          />
        )}
      </For>

      <button
        type="button"
        onClick={addScene}
        class="flex h-16 w-[114px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background text-muted-foreground"
      >
        <Icon name="plus-add" />
      </button>
    </div>
  );
}

type SceneItemProps = {
  scene: Scene;
  active: boolean;
  onDelete: () => void;
}

function SceneItem(props: SceneItemProps) {
  const [thumbnail] = createResource(() => props.scene, getThumbnail);

  const params = useParams();
  const navigate = useNavigate();

  return (
    <ContextMenu>
      <ContextMenuTrigger
        as="button"
        type="button"
        class="flex flex-col gap-2 w-[114px] shrink-0 aspect-video overflow-hidden rounded-md bg-background"
        onClick={() => navigate(`/${params.project}/${props.scene.slug}`)}
        classList={{
          "border border-border": !props.active,
          "border-2 border-primary": props.active,
        }}
      >
        <Show when={thumbnail()}>
          <img src={thumbnail()} alt={props.scene.label} class="h-full w-full object-cover" />
        </Show>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={props.onDelete}>
          <Trash />
          <span>Delete scene</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
