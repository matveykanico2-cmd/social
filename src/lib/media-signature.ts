function hasPrefix(bytes: Uint8Array, prefix: number[]) {
  return prefix.every((byte, index) => bytes[index] === byte);
}

export function validateFileSignature(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") return hasPrefix(bytes, [0xff, 0xd8, 0xff]);
  if (type === "image/png") return hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (type === "image/gif") return new TextDecoder().decode(bytes.slice(0, 6)) === "GIF87a" || new TextDecoder().decode(bytes.slice(0, 6)) === "GIF89a";
  if (type === "image/webp") return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (type === "application/pdf") return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (type === "video/mp4" || type === "video/quicktime") return new TextDecoder().decode(bytes.slice(4, 8)) === "ftyp";
  if (type === "video/webm") return hasPrefix(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
  return type.startsWith("audio/") || type === "application/zip" || type.startsWith("text/") || type.includes("word") || type.includes("excel");
}
