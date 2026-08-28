import { initialsFrom } from "@/lib/video/format";

type UserAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizes = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-24 w-24 text-2xl",
};

export function UserAvatar({ name, imageUrl, size = "md", className = "" }: UserAvatarProps) {
  const box = sizes[size];

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name ? `Foto de ${name}` : "Foto de perfil"}
        className={`${box} shrink-0 rounded-full object-cover ring-2 ring-white/10 ${className}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex ${box} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-klik-cyan to-klik-green font-bold text-klik-black ring-2 ring-white/10 ${className}`}
    >
      {initialsFrom(name)}
    </span>
  );
}
