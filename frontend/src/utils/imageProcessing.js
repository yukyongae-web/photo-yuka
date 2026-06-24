import { v4 as uuidv4 } from 'uuid';

/**
 * 이미지에서 EXIF 메타데이터를 제거하고 새로운 File 객체로 반환합니다.
 * 캔버스에 이미지를 그리고 다시 뽑아내는 방식을 통해 메타데이터를 완벽히 제거합니다.
 */
export const stripExifAndRename = async (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas to Blob failed'));
            return;
          }
          // 새로운 무작위 파일명 (UUID) 생성
          const extension = file.name.split('.').pop() || 'jpeg';
          const newFileName = `${uuidv4()}.${extension}`;
          
          const newFile = new File([blob], newFileName, {
            type: blob.type || 'image/jpeg',
          });
          resolve(newFile);
        },
        file.type || 'image/jpeg',
        1.0 // 100% quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
};
