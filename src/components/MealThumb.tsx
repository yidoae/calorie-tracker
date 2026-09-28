import { Utensils } from "lucide-react";
import Image from "next/image";

interface Props {
  imageUrl: string | null;
  name: string;
  /** Pixel size of the square thumbnail. */
  size: number;
}

export default function MealThumb({ imageUrl, name, size }: Props) {
  const style = { width: size, height: size };
  return imageUrl ? (
    <Image
      src={imageUrl}
      alt={name}
      width={size}
      height={size}
      unoptimized
      style={style}
      className="shrink-0 rounded-lg object-cover ring-1 ring-border"
    />
  ) : (
    <div style={style} className="flex shrink-0 items-center justify-center rounded-lg bg-surface-2 ring-1 ring-border">
      <Utensils aria-hidden className="size-1/3 text-fg-subtle" />
    </div>
  );
}
