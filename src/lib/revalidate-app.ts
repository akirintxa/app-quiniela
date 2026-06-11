import { revalidatePath } from "next/cache";

export function revalidateAfterMatchUpdate() {
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/ranking");
  revalidatePath("/groups", "layout");
  revalidatePath("/profile");
}
