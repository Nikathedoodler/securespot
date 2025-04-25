"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function ProfileAvatar() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-8 w-8 rounded-full bg-gray-300 animate-pulse" />;
  }

  if (!session?.user) return null;

  return (
    <Link href="/profile" className="flex items-center">
      <div className="relative h-8 w-8 rounded-full overflow-hidden">
        <Image
          src={session.user.image || "/default-avatar.png"}
          alt="Profile"
          fill
          className="object-cover"
          sizes="32px"
          priority
        />
      </div>
    </Link>
  );
}
