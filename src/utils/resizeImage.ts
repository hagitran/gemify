export default async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const { width, height } = img;
      let newWidth = width;
      let newHeight = height;
      if (width > maxWidth || height > maxHeight) {
        const aspect = width / height;
        if (width > height) {
          newWidth = maxWidth;
          newHeight = Math.round(maxWidth / aspect);
        } else {
          newHeight = maxHeight;
          newWidth = Math.round(maxHeight * aspect);
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Could not get canvas context"));
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
