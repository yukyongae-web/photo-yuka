// Cloudflare Worker API 엔드포인트 URL
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787';

/**
 * 전처리된 이미지와 선택한 옵션을 백엔드(Worker)로 전송합니다.
 * @param {File} file - 메타데이터가 제거된 이미지 파일
 * @param {string} option - 선택한 서비스 옵션 ('빠른 사진', '고급 사진', '맞춤형 사진')
 */
export const uploadPhoto = async (file, option) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('option', option);

  try {
    const response = await fetch(`${WORKER_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '이미지 전송에 실패했습니다.');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
