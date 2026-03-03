export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Prefix a path with the base path for GitHub Pages compatibility */
export function withBasePath(path: string): string {
  if (!basePath) return path;
  return `${basePath}${path}`;
}
