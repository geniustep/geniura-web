import Image from "next/image";

// Display the original supplied logo without changing its proportions.
export function BrandMark() {
  return (
    <Image
      src="/brand/logo.png"
      alt="Geniura"
      width={144}
      height={48}
      className="h-10 w-auto object-contain"
    />
  );
}
