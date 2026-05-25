/** Bandera del equipo favorito (o inicial) en listados de liga/ranking */
export default function MemberBadge({
  flagUrl,
  nickname,
  size = "md",
  inverted = false,
}: {
  flagUrl: string | null;
  nickname: string;
  size?: "sm" | "md";
  inverted?: boolean;
}) {
  const box =
    size === "sm"
      ? "w-8 h-6 rounded-md"
      : "w-10 h-7 sm:w-12 sm:h-8 rounded-lg";

  const border = inverted ? "border-white/30" : "border-gray-100 dark:border-zinc-700";
  const bg = inverted
    ? "bg-white/10"
    : "bg-gray-50 dark:bg-zinc-800";

  if (flagUrl) {
    return (
      <div
        className={`${box} overflow-hidden border ${border} shrink-0`}
      >
        <img src={flagUrl} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${box} flex items-center justify-center border ${border} ${bg} shrink-0`}
    >
      <span
        className={`font-black uppercase ${size === "sm" ? "text-[9px]" : "text-xs"} ${
          inverted ? "text-white" : "text-gray-400"
        }`}
      >
        {nickname.charAt(0) || "?"}
      </span>
    </div>
  );
}
