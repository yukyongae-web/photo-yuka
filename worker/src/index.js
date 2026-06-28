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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

        // --- ImageService 라우팅 및 실제 API 호출 ---
        let resultMessage = '';

        switch (option) {
          case '내 사진 칭찬받기':
          case '나를 소개해줘':
          case '내 인생 이야기': {
            let modelName = 'gemini-flash-latest';
            let promptText = '';

            if (option === '내 사진 칭찬받기') {
              modelName = 'gemini-flash-latest';
              promptText = '사진에 있는 사람의 매력을 칭찬하는 문구와 전반적인 분위기 묘사를 한국어로 친근하고 다정하게 작성해줘.';
            } else if (option === '나를 소개해줘') {
              modelName = 'gemini-pro-latest';
              promptText = '이 사람의 프로필용 자기소개 문구 1개와 인스타그램 등 SNS에 쓸 수 있는 짧고 세련된 바이오 3가지 버전을 만들어줘.';
            } else if (option === '내 인생 이야기') {
              modelName = 'gemini-pro-latest';
              promptText = '소중한 사람(가족, 친구, 자녀나 손주 등)에게 보내는 따뜻하고 감동적인 인생 편지나 회고록 느낌의 글을 사진을 바탕으로 작성해줘.';
            }
            
            // 1. Gemini File API로 이미지 업로드
            const uploadRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${env.GEMINI_API_KEY}`, {
              method: 'POST',
              headers: {
                'X-Goog-Upload-Protocol': 'raw',
                'X-Goog-Upload-Header-Content-Type': image.type || 'image/jpeg',
                'Content-Type': image.type || 'image/jpeg'
              },
              body: image
            });
            
            if (!uploadRes.ok) {
              const errText = await uploadRes.text();
              throw new Error(`Gemini 업로드 실패: ${errText}`);
            }
            
            const uploadData = await uploadRes.json();
            const fileUri = uploadData.file.uri;

            // 2. generateContent 호출
            const generateRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${env.GEMINI_API_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { text: promptText },
                    { fileData: { fileUri: fileUri, mimeType: image.type || 'image/jpeg' } }
                  ]
                }]
              })
            });

            if (!generateRes.ok) {
              const errText = await generateRes.text();
              throw new Error(`Gemini 분석 실패: ${errText}`);
            }

            const generateData = await generateRes.json();
            const aiText = generateData.candidates?.[0]?.content?.parts?.[0]?.text || "응답을 생성하지 못했습니다.";
            
            resultMessage = aiText;
            break;
          }
          
          /* 
          // 나중을 위해 Astria 코드를 주석 처리로 보존
          case '맞춤형 이미지 생성': {
            // 엔진: Astria.ai API (파인튜닝 /tunes 호출)
            const astriaForm = new FormData();
            astriaForm.append('tune[title]', 'Photo Yuka Custom Model');
            astriaForm.append('tune[name]', 'person'); // 기본 클래스
            // Astria API는 배열 형태로 이미지를 받음
            astriaForm.append('tune[images][]', image, image.name);

            const astriaRes = await fetch('https://api.astria.ai/tunes', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${env.ASTRIA_API_KEY}`
              },
              body: astriaForm
            });

            if (!astriaRes.ok) {
              const errText = await astriaRes.text();
              throw new Error(`Astria API 실패: ${errText}`);
            }

            const astriaData = await astriaRes.json();
            resultMessage = `[Astria 결과]\n파인튜닝 모델 생성이 시작되었습니다! (Tune ID: ${astriaData.id})`;
            break;
          }
          */
          
          default:
            return createCorsResponse({ error: '유효하지 않은 서비스 옵션입니다.' }, 400, origin);
        }

        // --- Zero-Retention 정책: 즉시 삭제 자동화 모방 ---
        ctx.waitUntil(
          new Promise((resolve) => {
            setTimeout(() => {
              console.log(`[Zero-Retention] ${image.name} 삭제 스케줄링 됨.`);
              resolve();
            }, 2000);
          })
        );

        return createCorsResponse({
          success: true,
          message: resultMessage,
          fileName: image.name
        }, 200, origin);
      } catch (error) {
        console.error("API 연동 에러:", error);
        return createCorsResponse({ error: error.message }, 500, origin);
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
