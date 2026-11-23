"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CinematicScene } from "./CinematicScene";
export const avatarKey = "moneyquest_avatar_v1";
export function readAvatar() {
  try {
    const id = Number(localStorage.getItem(avatarKey));
    return Number.isInteger(id) && id >= 1 && id <= 6 ? id : 0;
  } catch {
    return 0;
  }
}
export function AdventureAvatar({
  id,
  animated = false,
  size = 120,
}: {
  id?: number;
  animated?: boolean;
  size?: number;
}) {
  const [saved, setSaved] = useState(0);
  useEffect(() => setSaved(readAvatar()), []);
  const choice = id ?? saved;
  if (!choice) return null;
  const base = "/cinematic/avatars/avatar-0";
  const poster = base + choice + "/portrait.webp";
  return animated ? (
    <CinematicScene
      controls={false}
      className="mx-auto h-32 w-full object-contain"
      poster={poster}
      src={base + choice + "/animation.webm"}
    />
  ) : (
    <Image
      unoptimized
      alt=""
      src={poster}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        maxWidth: "100%",
      }}
    />
  );
}
