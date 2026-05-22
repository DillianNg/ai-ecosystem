"use client";

import Image from "next/image";
import { useState } from "react";

interface CompanyLogoProps {
  name: string;
  logo: string;
  size?: number;
}

export function CompanyLogo({ name, logo, size = 48 }: CompanyLogoProps) {
  const [error, setError] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (error) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 font-bold text-white"
        style={{ width: size, height: size, fontSize: size * 0.3 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={logo}
      alt={`${name} logo`}
      width={size}
      height={size}
      unoptimized
      className="shrink-0 rounded-xl bg-zinc-100 object-cover dark:bg-zinc-800"
      onError={() => setError(true)}
    />
  );
}
