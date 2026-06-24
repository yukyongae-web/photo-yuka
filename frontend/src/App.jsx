import React, { useState, useRef } from 'react';
import { stripExifAndRename } from './utils/imageProcessing';
import { uploadPhoto } from './api/cloudflareService';
import './index.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultMessage('');
    }
  };

  const handleOptionSelect = async (option) => {
    if (!selectedFile) {
      alert('먼저 사진을 업로드해주세요.');
      return;
    }
    if (!privacyAgreed) {
      alert('개인정보 즉시 삭제 동의 항목에 체크해주세요.');
      return;
    }

    setLoading(true);
    setResultMessage('');

    try {
      // 1. EXIF 제거 및 파일명 난수화
      const processedFile = await stripExifAndRename(selectedFile);
      
      // 2. Cloudflare Worker로 전송
      const result = await uploadPhoto(processedFile, option);
      
      setResultMessage(`[${option}] 신청이 완료되었습니다! (임시 결과: ${result.message})`);
    } catch (error) {
      setResultMessage(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Photo yuka</h1>
        <p className="text-xl text-gray-600">가장 쉽고 빠른 나만의 AI 사진관</p>
      </header>

      <main className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        
        {/* 사진 업로드 영역 */}
        <div className="mb-8 text-center">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          
          {previewUrl ? (
            <div className="mb-6 flex flex-col items-center">
              <img src={previewUrl} alt="Preview" className="w-48 h-48 object-cover rounded-lg shadow-md mb-4" />
              <button 
                onClick={() => fileInputRef.current.click()}
                className="text-lg text-blue-600 hover:text-blue-800 underline"
              >
                다른 사진으로 변경하기
              </button>
            </div>
          ) : (
            <button 
              onClick={() => fileInputRef.current.click()}
              className="w-full py-12 border-4 border-dashed border-gray-300 rounded-xl text-2xl font-bold text-gray-500 hover:bg-gray-50 hover:border-blue-400 transition-colors"
            >
              📷 내 사진 고르기 (터치)
            </button>
          )}
        </div>

        {/* 개인정보 동의 영역 */}
        <div className="bg-blue-50 p-4 rounded-lg mb-8">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500"
              checked={privacyAgreed}
              onChange={(e) => setPrivacyAgreed(e.target.checked)}
            />
            <span className="text-lg font-medium text-gray-800">
              [필수] 내 사진은 이번 생성에만 사용되고 즉시 삭제되는 것에 동의합니다.
            </span>
          </label>
          <p className="mt-2 text-sm text-gray-500 pl-9">
            🔒 안심 약속: 고객님의 사진은 새 프로필 완성 즉시 시스템에서 완전히 영구 삭제됩니다.
          </p>
        </div>

        {/* 서비스 선택 버튼 영역 */}
        <div className="space-y-4">
          <button 
            onClick={() => handleOptionSelect('빠른 사진')}
            disabled={loading}
            className="w-full py-5 bg-green-500 hover:bg-green-600 text-white text-2xl font-bold rounded-xl shadow-lg transition-colors disabled:opacity-50"
          >
            🚀 빠른 사진 (기본 증명/프로필)
          </button>
          <button 
            onClick={() => handleOptionSelect('고급 사진')}
            disabled={loading}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold rounded-xl shadow-lg transition-colors disabled:opacity-50"
          >
            ✨ 고급 사진 (고해상도 테마/배경)
          </button>
          <button 
            onClick={() => handleOptionSelect('맞춤형 사진')}
            disabled={loading}
            className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white text-2xl font-bold rounded-xl shadow-lg transition-colors disabled:opacity-50"
          >
            💎 맞춤형 사진 (나만의 AI 모델 생성)
          </button>
        </div>

        {/* 로딩 및 결과 메시지 */}
        {loading && (
          <div className="mt-8 text-center text-xl font-bold text-gray-700">
            ⏳ 사진을 안전하게 전송하고 있습니다...
          </div>
        )}
        
        {resultMessage && !loading && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-center text-lg font-medium text-gray-800">
            {resultMessage}
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
