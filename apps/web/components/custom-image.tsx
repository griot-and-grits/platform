"use client";
import Image from "next/image";

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
        <Image
            src={src}
            alt={alt}
            width="500"
            height="500"
            className={className}
        />
    );
}
