// worker/src/index.js

function handleOptions(request) {
  const origin = request.headers.get('Origin');
  let allowedOrigin = 'https://photo.yuka.kr';
  
  // 로컬 개발 환경 허용
  if (origin === 'http://localhost:5173') {
    allowedOrigin = origin;
  }

  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function createCorsResponse(body, status = 200, origin = 'https://photo.yuka.kr') {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    // 1. CORS Preflight 처리
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    const origin = request.headers.get('Origin') === 'http://localhost:5173' ? 'http://localhost:5173' : 'https://photo.yuka.kr';
    const url = new URL(request.url);

    // 2. 메인 업로드 엔드포인트
    if (url.pathname === '/api/upload' && request.method === 'POST') {
      try {
        const formData = await request.formData();
        const image = formData.get('image'); // 프론트엔드에서 메타데이터가 삭제되고 UUID로 변환된 파일
        const option = formData.get('option');

        if (!image || !option) {
          return createCorsResponse({ error: '이미지 파일 또는 옵션 정보가 누락되었습니다.' }, 400, origin);
        }

        // --- ImageService 라우팅 및 3단계 결제 로직 모방 ---
        let resultMessage = '';

        switch (option) {
          case '빠른 사진':
            // 엔진: Gemini 1.5 Flash
            // 결제: 무료 (또는 무료 크레딧 차감)
            resultMessage = 'Gemini 1.5 Flash 엔진으로 증명사진 생성을 완료했습니다 (기본 무료).';
            break;
          case '고급 사진':
            // 엔진: Gemini 1.5 Pro
            // 결제: 1회 결제 필요 (목업)
            resultMessage = '결제 확인됨. Gemini 1.5 Pro 엔진으로 고품질 아트 사진 생성을 완료했습니다.';
            break;
          case '맞춤형 사진':
            // 엔진: Astria.ai API
            // 결제: 1회 결제 필요 (목업)
            resultMessage = '결제 확인됨. Astria.ai 파인튜닝을 통해 나만의 맞춤형 프로필을 생성했습니다.';
            break;
          default:
            return createCorsResponse({ error: '유효하지 않은 서비스 옵션입니다.' }, 400, origin);
        }

        // --- Zero-Retention 정책: 즉시 삭제 자동화 모방 ---
        // 백그라운드에서 외부 API (Astria 등)에 데이터 삭제 요청을 보냄
        ctx.waitUntil(
          new Promise((resolve) => {
            setTimeout(() => {
              console.log(`[Zero-Retention] ${image.name} 및 생성된 모델 데이터가 원격 서버에서 완전히 삭제되었습니다.`);
              resolve();
            }, 2000); // 데모를 위한 2초 딜레이
          })
        );

        return createCorsResponse({
          success: true,
          message: resultMessage,
          fileName: image.name // UUID 처리된 파일명 확인용
        }, 200, origin);
      } catch (error) {
        return createCorsResponse({ error: error.message }, 500, origin);
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
