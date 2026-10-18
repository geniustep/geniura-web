import Image from "next/image";

// Display the original supplied logo without changing its proportions.
export function BrandMark() {
  return (
    <Image
      src="/brand/logo.svg"
      alt="Geniura"
      width={171}
      height={50}
      className="h-9 w-auto object-contain sm:h-10"
    />
  );
}
