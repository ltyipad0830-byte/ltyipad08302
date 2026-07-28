import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [subject, setSubject] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedInstructorGroup, setSelectedInstructorGroup] = useState(null);
  const [selectedLecture, setSelectedLecture] = useState(null);

  const [cache, setCache] = useState({});

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmedSubject = subject.trim();
    if (!trimmedSubject) return;

    setSelectedInstructorGroup(null);
    setSelectedLecture(null);

    if (cache[trimmedSubject]) {
      setResults(cache[trimmedSubject]);
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: trimmedSubject }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`서버 응답 오류: ${text.slice(0, 100)}...`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '데이터를 가져오지 못했습니다.');
      }

      setCache(prev => ({ ...prev, [trimmedSubject]: data.results }));
      setResults(data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#10131b] text-[#e1e2ed] flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#1d1f27]/90 backdrop-blur-md border-b border-[#424754] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-[#afc6ff] text-[#002d6d] flex items-center justify-center font-bold text-xl shadow-lg">
            Edu
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#e1e2ed]">EduAI Smart Platform</h1>
            <p className="text-xs text-[#c2c6d7]">22개정 대규모 인강 및 맞춤형 대상 분석 아카이브</p>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <span className="text-xs px-3 py-1 rounded-full bg-[#191b23] text-[#afc6ff] border border-[#424754]">
            High-Contrast Dark Enterprise Mode
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10">
        <div className="text-center my-8">
          <span className="inline-block px-4 py-1 text-xs font-semibold bg-[#1d1f27] text-[#afc6ff] rounded-full border border-[#424754] mb-3">
            ✨ AI 기반 대규모 다중 강사 추천 시스템
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#e1e2ed] mb-3">
            원하시는 과목의 모든 강사진과 수십 개 인강을 비교하세요
          </h2>
          <p className="text-[#c2c6d7] text-sm md:text-base max-w-2xl mx-auto">
            메가스터디, 대성마이맥 등 모든 강사진의 강좌를 빠짐없이 탐색하고, 강의별 상세 설명과 적합한 학생 유형을 확인하실 수 있습니다.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-12">
          <div className="ai-glow flex items-center bg-[#1d1f27] border border-[#424754] rounded-lg p-2 shadow-2xl">
            <input
              type="text"
              placeholder="예: 미적분, 공통수학2, 수학(상) 등 입력..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-[#e1e2ed] placeholder-[#8c90a0] text-base"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#afc6ff] text-[#002d6d] font-bold rounded-md hover:bg-[#8bb0ff] transition-all disabled:opacity-50 cursor-pointer shadow-md"
            >
              {loading ? '분석 중...' : '전체 강사 조회'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-[#93000a]/30 border border-[#ffb4ab] text-[#ffb4ab] p-4 rounded-lg text-center mb-8 font-medium">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#afc6ff] border-t-transparent mb-4"></div>
            <p className="text-[#c2c6d7] text-sm font-medium">모든 사이트의 수많은 강사진과 난이도별 인강 리스트를 수집 중입니다...</p>
          </div>
        )}

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((group, index) => (
            <div
              key={index}
              className="card-container p-6 cursor-pointer flex flex-col justify-between"
              onClick={() => {
                setSelectedInstructorGroup(group);
                setSelectedLecture(null);
              }}
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="px-3 py-1 text-xs font-bold rounded bg-[#272a32] text-[#afc6ff] border border-[#424754]">
                    {group.site}
                  </span>
                  <span className="text-sm font-semibold text-[#e1e2ed]">{group.instructor} 강사</span>
                </div>
                <h3 className="text-lg font-bold text-[#e1e2ed] mb-2">
                  {group.instructor} 강사의 개설 인강 ({group.lectures.length}개)
                </h3>
                <p className="text-sm text-[#c2c6d7] line-clamp-2 mb-4">
                  {group.mainFeature || '다양한 난이도별 맞춤형 커리큘럼 제공'}
                </p>
              </div>
              <div className="border-t border-[#32353d] pt-4 flex justify-between items-center text-xs text-[#afc6ff] font-semibold">
                <span>📚 시중 교재 {group.recommendedBooks?.length || 0}권 연동</span>
                <span>모든 강좌 & 대상 보기 ➔</span>
              </div>
            </div>
          ))}
        </div>

        {/* Instructor Modal */}
        {selectedInstructorGroup && (
          <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#191b23] border border-[#424754] rounded-xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <span className="px-3 py-1 text-xs font-bold rounded bg-[#272a32] text-[#afc6ff] border border-[#424754]">
                  {selectedInstructorGroup.site}
                </span>
                <button
                  onClick={() => setSelectedInstructorGroup(null)}
                  className="text-[#8c90a0] hover:text-[#e1e2ed] text-xl font-bold px-2"
                >
                  ✕
                </button>
              </div>

              <h2 className="text-2xl font-extrabold text-[#e1e2ed] mb-1">
                {selectedInstructorGroup.instructor} 강사 추천 인강 목록
              </h2>
              <p className="text-sm text-[#c2c6d7] mb-6">
                소속: <strong className="text-[#e1e2ed]">{selectedInstructorGroup.site}</strong> | 총 추천 강좌: <strong className="text-[#e1e2ed]">{selectedInstructorGroup.lectures.length}개</strong>
              </p>

              <div className="bg-[#afc6ff]/10 border border-[#afc6ff]/30 text-[#afc6ff] p-3 rounded-lg text-xs mb-6 font-medium">
                💡 원하는 강의를 클릭하시면 상세 설명과 적합한 학생 유형을 확인하실 수 있습니다.
              </div>

              {/* Lectures List */}
              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-bold text-[#e1e2ed]">📚 추천 인강 리스트 (클릭 가능)</h4>
                {selectedInstructorGroup.lectures.map((lec, lIdx) => (
                  <div
                    key={lIdx}
                    onClick={() => setSelectedLecture(lec)}
                    className="bg-[#1d1f27] border border-[#334155] hover:border-[#afc6ff] p-4 rounded-lg cursor-pointer transition-all flex justify-between items-center"
                  >
                    <div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#272a32] text-[#d4bbff] mr-2">
                        {lec.level || '일반'}
                      </span>
                      <span className="text-sm font-bold text-[#e1e2ed]">{lec.title}</span>
                      <p className="text-xs text-[#c2c6d7] mt-1 line-clamp-1">{lec.description}</p>
                    </div>
                    <span className="text-xs text-[#afc6ff] font-semibold whitespace-nowrap ml-4">상세 분석 ➔</span>
                  </div>
                ))}
              </div>

              {/* Recommended Books */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-[#e1e2ed]">📖 추천 시중 교재 리스트</h4>
                <div className="grid grid-cols-1 gap-2">
                  {selectedInstructorGroup.recommendedBooks?.map((book, bIdx) => (
                    <div key={bIdx} className="bg-[#1d1f27] border border-[#334155] p-3 rounded-lg">
                      <p className="text-sm font-bold text-[#e1e2ed]">{book.name}</p>
                      <p className="text-xs text-[#c2c6d7] mt-0.5">{book.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lecture Detail Modal */}
        {selectedLecture && (
          <div className="modal-backdrop fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-[#1d1f27] border border-[#424754] rounded-xl max-w-lg w-full p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#272a32] text-[#d4bbff] border border-[#424754]">
                  {selectedLecture.level || '일반'}
                </span>
                <button
                  onClick={() => setSelectedLecture(null)}
                  className="text-[#8c90a0] hover:text-[#e1e2ed] text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              <h3 className="text-xl font-extrabold text-[#e1e2ed] mb-4">{selectedLecture.title}</h3>

              <div className="bg-[#191b23] border border-[#334155] p-4 rounded-lg mb-4">
                <h5 className="text-xs font-bold text-[#afc6ff] uppercase tracking-wider mb-2">📌 강의 상세 설명</h5>
                <p className="text-sm text-[#c2c6d7] leading-relaxed">{selectedLecture.description}</p>
              </div>

              <div className="bg-[#191b23] border border-[#ffb68f]/30 p-4 rounded-lg mb-6">
                <h5 className="text-xs font-bold text-[#ffb68f] uppercase tracking-wider mb-2">🎯 이 강의에 가장 적합한 학생 유형</h5>
                <p className="text-sm text-[#e1e2ed] font-medium leading-relaxed">
                  {selectedLecture.targetStudent || '해당 난이도의 개념을 확실히 다지고 실력을 도약하고 싶은 학생'}
                </p>
              </div>

              <button
                onClick={() => setSelectedLecture(null)}
                className="w-full py-3 bg-[#afc6ff] text-[#002d6d] font-bold rounded-lg hover:bg-[#8bb0ff] transition-all cursor-pointer"
              >
                확인 완료
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#424754] py-6 text-center text-xs text-[#c2c6d7]">
        © 2026 EduAI Smart Learning Platform. All rights reserved.
      </footer>
    </div>
  );
}
