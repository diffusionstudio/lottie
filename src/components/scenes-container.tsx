import { For } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import { Icon } from "@/components/ui/icon";
import { useScenes } from "@/context/scenes";

export function ScenesContainer() {
  const params = useParams();
  const navigate = useNavigate();
  const { findProject } = useScenes();

  const scenes = () => (params.project ? findProject(params.project)?.scenes ?? [] : []);

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
        {(scene) => {
          const active = () => scene.slug === params.scene;
          return (
            <button
              type="button"
              class="flex flex-col gap-2 w-[114px] shrink-0"
              onClick={() => navigate(`/${params.project}/${scene.slug}`)}
            >
              <div
                class="aspect-video w-full overflow-hidden rounded-md bg-background"
                classList={{
                  "border border-border": !active(),
                  "border-2 border-primary": active(),
                }}
              />
              <span class="text-center text-xxs text-muted-foreground">{scene.label}</span>
            </button>
          );
        }}
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
