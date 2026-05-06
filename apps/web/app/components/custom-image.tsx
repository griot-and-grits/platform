
export default function CustomImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={500}
      height={500}
      className={className}
      loading="lazy"
    />
  );
}
