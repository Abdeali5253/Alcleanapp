interface ProductBadgeProps {
  type: "discount" | "new" | "limited";
  value?: number;
}

export function ProductBadge({ type, value }: ProductBadgeProps) {
  const badges = {
    discount: {
      text: `-${value}%`,
      className: "bg-gradient-to-r from-red-500 to-red-600 text-white",
    },
    new: {
      text: "NEW",
      className: "bg-gradient-to-r from-[#6DB33F] to-[#5da035] text-white",
    },
    limited: {
      text: "LIMITED",
      className: "bg-gradient-to-r from-orange-500 to-orange-600 text-white",
    },
  };

  const badge = badges[type];

  return (
    <span className={`${badge.className} text-[10px] font-semibold px-2 py-1 rounded-lg shadow-md`}>
      {badge.text}
    </span>
  );
}
