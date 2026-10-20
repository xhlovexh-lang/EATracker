export function slugifyGameName(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || "game";
}

export function createUniqueGameSlug(
  name: string,
  appid: number,
  existingOwnerAppid?: number | null
): string {
  const base = slugifyGameName(name);
  if (existingOwnerAppid && existingOwnerAppid !== appid) {
    return `${base}-${appid}`;
  }
  return base;
}
