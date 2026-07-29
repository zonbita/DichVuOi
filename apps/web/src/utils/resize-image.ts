/** Crop giữa + scale ảnh thành hình vuông (mặc định 200×200), xuất JPEG. */
export async function resizeImageToSquare(
  file: File,
  size = 200,
): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Không xử lý được ảnh trên trình duyệt này');
  }

  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const drawW = bitmap.width * scale;
  const drawH = bitmap.height * scale;
  const x = (size - drawW) / 2;
  const y = (size - drawH) / 2;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(bitmap, x, y, drawW, drawH);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error('Không mã hóa được ảnh')),
      'image/jpeg',
      0.9,
    );
  });

  return new File([blob], 'avatar-200.jpg', { type: 'image/jpeg' });
}
