"use client";

import { useState } from "react";

type Props = {
  imageUrl: string;
  alt: string;
  previewAlt: string;
};

const PREVIEW_REQUIRED_SPACE = 220;

export default function ImageHoverPreview({
  imageUrl,
  alt,
  previewAlt,
}: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [showPreviewAbove, setShowPreviewAbove] = useState(false);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setShowPreviewAbove(spaceBelow < PREVIEW_REQUIRED_SPACE);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="w-10 h-10 overflow-hidden rounded border border-gray-200 bg-gray-50">
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full max-w-none object-cover object-center"
        />
      </div>
      {isHovered && (
        <div
          className={`absolute z-20 left-1/2 -translate-x-1/2 p-1 bg-white border border-gray-200 rounded shadow-lg ${
            showPreviewAbove ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <div className="w-48 h-48 overflow-hidden rounded bg-gray-50">
            <img
              src={imageUrl}
              alt={previewAlt}
              className="w-full h-full max-w-none object-cover object-center"
            />
          </div>
        </div>
      )}
    </div>
  );
}
