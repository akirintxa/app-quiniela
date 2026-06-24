import { revalidatePath, revalidateTag } from "next/cache";

export const GLOBAL_RANKING_CACHE_TAG = "global-ranking";

/** Invalidación amplia tras cambios manuales en admin. */
export function revalidateAfterMatchUpdate() {
  revalidateTag(GLOBAL_RANKING_CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/ranking");
  revalidatePath("/groups", "layout");
  revalidatePath("/profile");
}

/** Invalidación ligera tras crons automáticos (Realtime debounced cubre usuarios online). */
export function revalidateAfterCronMatchUpdate() {
  revalidateTag(GLOBAL_RANKING_CACHE_TAG, "max");
  revalidatePath("/admin");
}
