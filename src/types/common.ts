export interface ControlMeta {
  sid: string;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface Scene {
  /** Folder name, kept verbatim (e.g. "scene-1"). Used as the URL segment. */
  slug: string;
  /** Human label derived from the slug (e.g. "Scene 1"). */
  label: string;
  /** Sort order parsed from a trailing "-NN" in the slug; Infinity when absent. */
  order: number;
  /** Public URL of the scene's lottie.json. */
  lottie: string;
  /** Public URL of the scene's controls.json, when present. */
  controls?: string;
  /** Public URLs of image assets in the scene folder. */
  images: string[];
}

export interface Project {
  slug: string;
  label: string;
  scenes: Scene[];
}

export interface ScenesTree {
  projects: Project[];
}

export type AnimationSlot =
  | { id: string; type: "scalar"; value: number }
  | { id: string; type: "color"; value: [number, number, number, number] }
  | { id: string; type: "vec2"; value: [number, number] }
  | { id: string; type: "text"; value: string };
