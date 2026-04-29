import * as yaml from "js-yaml";
import type { VideoMetadata, FilterMetadata } from "./video-metadata";

// Vite inlines these as raw strings at build time — no fs needed, works on Cloudflare Workers.
import videosRaw from "~/metadata/videos.yaml?raw";
import filtersRaw from "~/metadata/filters.yaml?raw";

export function loadVideoMetadata(): VideoMetadata {
  try {
    return yaml.load(videosRaw) as VideoMetadata;
  } catch {
    return { videos: [] };
  }
}

export function loadFilterMetadata(): FilterMetadata {
  try {
    return yaml.load(filtersRaw) as FilterMetadata;
  } catch {
    return { tags: [], people: [] };
  }
}
