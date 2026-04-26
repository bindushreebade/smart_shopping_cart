import { ReactNode, useEffect, useRef, useState } from "react";

interface ProductImageProps {
  imageUrl?: string | null;
  name: string;
  category?: string | null;
  alt?: string;
  className?: string;
  fallback?: ReactNode;
}

const GENERIC_GROCERY_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80";

function buildCandidates(
  imageUrl: string | null | undefined,
  _name: string,
  _category?: string | null,
): string[] {
  const trimmed = imageUrl?.trim() || null;

  return [trimmed, GENERIC_GROCERY_IMAGE]
    .filter((v): v is string => Boolean(v))
    .filter((v, i, arr) => arr.indexOf(v) === i);
}

export function ProductImage({
  imageUrl,
  name,
  category,
  alt,
  className,
  fallback,
}: ProductImageProps) {
  // Refs avoid stale-closure bugs in the onError handler — the old code
  // captured `index` from state, which never updated inside the callback.
  const candidatesRef = useRef<string[]>([]);
  const indexRef = useRef(0);

  const [src, setSrc] = useState<string>(() => {
    const c = buildCandidates(imageUrl, name, category);
    candidatesRef.current = c;
    indexRef.current = 0;
    return c[0] ?? GENERIC_GROCERY_IMAGE;
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const c = buildCandidates(imageUrl, name, category);
    candidatesRef.current = c;
    indexRef.current = 0;
    setSrc(c[0] ?? GENERIC_GROCERY_IMAGE);
    setFailed(false);
  }, [imageUrl, name, category]);

  if (failed) return <>{fallback ?? null}</>;

  return (
    <img
      src={src}
      alt={alt ?? name}
      loading="lazy"
      onError={() => {
        const next = indexRef.current + 1;
        if (next < candidatesRef.current.length) {
          indexRef.current = next;
          setSrc(candidatesRef.current[next]);
        } else {
          setFailed(true);
        }
      }}
      className={className}
    />
  );
}
