import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
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
      
      setResultMessage(`[${option}] 신청이 완료되었습니다!\n\n${result.message}`);
    } catch (error) {
      setResultMessage(`오류가 발생했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">인생사진관</h1>
        <p className="text-xl text-gray-600">당신의 사진을 특별하게 만들어드립니다</p>
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
              [필수] 내 사진은 AI 분석에만 사용되며, 분석 즉시 삭제되는 것에 동의합니다.
            </span>
          </label>
          <p className="mt-2 text-sm text-gray-500 pl-9">
            🔒 개인정보 보호: 안심하세요. 업로드하신 사진은 AI 분석 후 즉시 삭제되며 저장되지 않습니다.
          </p>
        </div>

        {/* 서비스 선택 버튼 영역 */}
        <div className="space-y-4">
          <button 
            onClick={() => handleOptionSelect('내 사진 칭찬받기')}
            disabled={loading}
            className="w-full py-5 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg transition-colors disabled:opacity-50 flex flex-col items-center justify-center"
          >
            <span className="text-2xl font-bold mb-1">📸 내 사진 칭찬받기</span>
            <span className="text-sm font-medium opacity-90">AI가 내 사진의 매력을 찾아드려요</span>
          </button>
          
          <button 
            onClick={() => handleOptionSelect('나를 소개해줘')}
            disabled={loading}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-colors disabled:opacity-50 flex flex-col items-center justify-center"
          >
            <span className="text-2xl font-bold mb-1">💌 나를 소개해줘</span>
            <span className="text-sm font-medium opacity-90">프로필·SNS용 자기소개 문구 3가지</span>
          </button>
          
          <button 
            onClick={() => handleOptionSelect('내 인생 이야기')}
            disabled={loading}
            className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg transition-colors disabled:opacity-50 flex flex-col items-center justify-center"
          >
            <span className="text-2xl font-bold mb-1">📖 내 인생 이야기</span>
            <span className="text-sm font-medium opacity-90">소중한 사람에게 전하는 인생 편지</span>
          </button>
        </div>

        {/* 나중을 위한 구조 설계: 유료 버전 출시 시 활성화할 토글 (현재 숨김 상태) */}
        <div className="mt-6 flex justify-center hidden">
          <div className="bg-gray-200 p-1 rounded-lg inline-flex">
            <button className="px-4 py-2 bg-white rounded shadow text-sm font-bold text-gray-800">텍스트 모드</button>
            <button className="px-4 py-2 rounded text-sm font-bold text-gray-500 hover:text-gray-800">이미지 모드</button>
          </div>
        </div>

        {/* 로딩 및 결과 메시지 */}
        {loading && (
          <div className="mt-8 text-center text-xl font-bold text-gray-700">
            ⏳ 사진을 안전하게 전송하고 있습니다...
          </div>
        )}
        
        {resultMessage && !loading && (
          <div className="mt-8 p-6 bg-gray-100 rounded-lg text-left text-lg text-gray-800 shadow-inner">
            <ReactMarkdown className="space-y-4">
              {resultMessage}
            </ReactMarkdown>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
