import { cn } from "@/lib/utils";
import React, { useState } from "react";

function SmartImage({ image, alt, className = "" }) {
  const [loaded, setLoaded] = useState(false);
  if (!image) return null;

  return (
    <picture>
      {image?.sources?.webp && (
        <source type="image/webp" srcSet={image.sources.webp} />
      )}
      <img
        src={image.img.src}
        srcSet={image.sources.webp}
        sizes="100vw"
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          className,
          loaded ? "opacity-100 blur-0" : "opacity-0 blur-md",
        )}
      />
    </picture>
  );
}

export default React.memo(SmartImage);
