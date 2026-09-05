"use client"

export const ACCEPTED_IMAGE_FORMATS = [
  "PNG",
  "JPEG",
  "JPG",
  "WEBP",
  "GIF",
] as const

export const ACCEPTED_IMAGE_EXTENSIONS = ACCEPTED_IMAGE_FORMATS.join(", ")

export const RECOMMENDED_ASPECT_RATIOS = ["1:1", "4:5", "16:9"]

export function ImageUploadNote() {
  return (
    <p className="text-[11px] text-gray-400 leading-snug">
      Accepted formats: <span className="font-semibold">{ACCEPTED_IMAGE_EXTENSIONS}</span>
      {" "}· Recommended aspect ratios:{" "}
      <span className="font-semibold">{RECOMMENDED_ASPECT_RATIOS.join(", ")}</span>
    </p>
  )
}
