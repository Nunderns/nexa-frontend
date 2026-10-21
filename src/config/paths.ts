/** Community names are unique, so they make readable, stable URLs. */
export function communityPath(name: string): string {
  return `/c/${encodeURIComponent(name)}`;
}

export function postPath(id: number): string {
  return `/posts/${id}`;
}
