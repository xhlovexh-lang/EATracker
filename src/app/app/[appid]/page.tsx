import { notFound, permanentRedirect } from "next/navigation";
import { getGameByAppId } from "../../../lib/catalog";

/**
 * Spec Section 7 & 14: `/app/[appid]` -> 301 Permanent Redirect to `/game/[slug]`
 */
export default async function AppIdRedirectPage({
  params,
}: {
  params: Promise<{ appid: string }>;
}) {
  const { appid } = await params;
  const numericId = Number.parseInt(appid, 10);
  if (!Number.isFinite(numericId)) {
    notFound();
  }

  const game = getGameByAppId(numericId);
  if (!game) {
    notFound();
  }

  permanentRedirect(`/game/${game.slug}`);
}
