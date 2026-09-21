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
      className="shrink-0 rounded-lg object-cover"
    />
  ) : (
    <div style={style} className="flex shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
      <Utensils className="size-1/3 text-zinc-400" />
    </div>
  );
}
