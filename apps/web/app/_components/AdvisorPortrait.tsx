"use client";

import { useMemo, useState } from "react";

type AdvisorPortraitProps = {
  advisorName: string;
  advisorTitle: string;
  photoUrl?: string | undefined;
  credentials?: string[];
  className?: string;
  showMeta?: boolean;
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AdvisorPortrait({
  advisorName,
  advisorTitle,
  photoUrl,
  credentials = [],
  className,
  showMeta = false
}: AdvisorPortraitProps) {
  const [failed, setFailed] = useState(false);
  const initials = useMemo(() => getInitials(advisorName), [advisorName]);
  const isPlaceholderUrl = photoUrl?.includes("example.com") ?? false;
  const canRenderImage = Boolean(photoUrl) && !failed && !isPlaceholderUrl;

  return (
    <figure className={["advisor-portrait", className].filter(Boolean).join(" ")}>
      <div className="advisor-portrait-frame">
        {canRenderImage ? (
          <img
            src={photoUrl}
            alt={advisorName}
            onError={() => {
              setFailed(true);
            }}
          />
        ) : (
          <div className="advisor-portrait-placeholder" aria-label={`${advisorName} placeholder portrait`}>
            {initials}
          </div>
        )}
      </div>
      {showMeta ? (
        <figcaption>
          <strong>{advisorName}</strong>
          <span>{advisorTitle}</span>
          {credentials.length > 0 ? (
            <div className="portrait-credentials">
              {credentials.slice(0, 3).map((credential) => (
                <small key={credential}>{credential}</small>
              ))}
            </div>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
