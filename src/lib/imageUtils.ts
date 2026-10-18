/**
 * Utility to resize, center-crop, and compress an avatar image file to a lightweight Base64 string.
 */
export async function processAvatarImage(file: File, maxSize = 256, quality = 0.85): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selected file must be an image (PNG, JPG, WebP, etc.).");
  }

  // Max 10MB raw limit before processing
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Image file size should be under 10MB.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image."));
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = maxSize;
          canvas.height = maxSize;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            return reject(new Error("Could not initialize 2D canvas context."));
          }

          // Center-crop to square
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, maxSize, maxSize);

          // Try webp first, with jpeg fallback
          let dataUrl = canvas.toDataURL("image/webp", quality);
          if (!dataUrl.startsWith("data:image/webp")) {
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }

          resolve(dataUrl);
        } catch (err: unknown) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Returns initials from a full name (e.g., "John Doe" -> "JD", "Saikiran" -> "S").
 */
export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
