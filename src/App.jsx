import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [currentTab, setCurrentTab] = useState('recommend'); // 'recommend' or 'board'

  // 추천 관련 상태
  const [subject, setSubject] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedInstructorGroup, setSelectedInstructorGroup] = useState(null);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [cache, setCache] = useState({});

  // 게시판 관련 상태 (초기 샘플 후기 포함)
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: '고3 수험생',
      title: '미적분 강사 추천 정리 정말 유용합니다!',
      content: '메가스터디랑 대성마이맥 강사진 비교가 한눈에 되어서 너무 좋네요. 덕분에 나한테 맞는 개념 강의 쉽게 찾았습니다. 감사합니다!',
      date: '2026-03-29'
    },
    {
      id: 2,
      author: '수학공부러',
      title: '공통수학2 커리큘럼 후기 남깁니다.',
      content: '시중 교재 연동 기능이 있어서 문제집 고를 때 참고하기 너무 편해요. 게시판 생겨서 서로 의견 나누기 더 좋아진 듯!',
      date: '2026-03-28'
    }
  ]);
  const [newAuthor, setNewAuthor] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

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

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newTitle.trim() || !newContent.trim()) {
      alert('작성자, 제목, 내용을 모두 입력해주세요.');
      return;
    }

    const newPost = {
      id: Date.now(),
      author: newAuthor.trim(),
      title: newTitle.trim(),
      content: newContent.trim(),
      date: new Date().toISOString().slice(0, 10)
    };

    setPosts([newPost, ...posts]);
    setNewAuthor('');
    setNewTitle('');
    setNewContent('');
  };

  return (
    <div className="edu-app">
      {/* Header */}
      <header className="edu-header">
        <div className="edu-logo-area">
          <div className="edu-logo-box">Edu</div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#e1e2ed' }}>EduAI Smart Platform</div>
            <div style={{ fontSize: '12px', color: '#c2c6d7' }}>22개정 대규모 인강 및 맞춤형 대상 분석 아카이브</div>
          </div>
        </div>
        <div className="edu-nav-buttons">
          <button
            onClick={() => setCurrentTab('recommend')}
            className={`edu-nav-btn ${currentTab === 'recommend' ? 'active' : ''}`}
          >
            📚 인강 추천 & 비교
          </button>
          <button
            onClick={() => setCurrentTab('board')}
            className={`edu-nav-btn ${currentTab === 'board' ? 'active' : ''}`}
          >
            💬 사용자 의견 게시판
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="edu-main">
        {currentTab === 'recommend' ? (
          <>
            <div className="edu-hero">
              <span className="edu-badge">✨ AI 기반 대규모 다중 강사 추천 시스템</span>
              <h1 className="edu-title">원하시는 과목의 모든 강사진과 수십 개 인강을 비교하세요</h1>
              <p className="edu-subtitle">
                메가스터디, 대성마이맥 등 모든 강사진의 강좌를 빠짐없이 탐색하고, 강의별 상세 설명과 적합한 학생 유형을 확인하실 수 있습니다.
              </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="edu-search-form">
              <div className="edu-search-box">
                <input
                  type="text"
                  placeholder="예: 미적분, 공통수학2, 수학(상) 등 입력..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="edu-input"
                />
                <button type="submit" disabled={loading} className="edu-submit-btn">
                  {loading ? '분석 중...' : '전체 강사 조회'}
                </button>
              </div>
            </form>

            {error && <div className="edu-error-box">{error}</div>}

            {loading && (
              <div className="edu-loading">
                <div className="edu-spinner"></div>
                <p>모든 사이트의 수많은 강사진과 난이도별 인강 리스트를 수집 중입니다...</p>
              </div>
            )}

            {/* Results Grid */}
            <div className="edu-grid">
              {results.map((group, index) => (
                <div
                  key={index}
                  className="edu-card"
                  onClick={() => {
                    setSelectedInstructorGroup(group);
                    setSelectedLecture(null);
                  }}
                >
                  <div>
                    <div className="edu-card-header">
                      <span className="edu-site-tag">{group.site}</span>
                      <span className="edu-instructor-name">{group.instructor} 강사</span>
                    </div>
                    <h3 className="edu-card-title">{group.instructor} 강사의 개설 인강 ({group.lectures.length}개)</h3>
                    <p className="edu-card-desc">{group.mainFeature || '다양한 난이도별 맞춤형 커리큘럼 제공'}</p>
                  </div>
                  <div className="edu-card-footer">
                    <span>📚 시중 교재 {group.recommendedBooks?.length || 0}권 연동</span>
                    <span>모든 강좌 & 대상 보기 ➔</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Instructor Modal */}
            {selectedInstructorGroup && (
              <div className="edu-modal-backdrop" onClick={() => setSelectedInstructorGroup(null)}>
                <div className="edu-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="edu-modal-header">
                    <span className="edu-site-tag">{selectedInstructorGroup.site}</span>
                    <button className="edu-close-btn" onClick={() => setSelectedInstructorGroup(null)}>✕</button>
                  </div>

                  <h2 className="edu-modal-title">{selectedInstructorGroup.instructor} 강사 추천 인강 목록</h2>
                  <p className="edu-modal-sub">소속 플랫폼: <strong>{selectedInstructorGroup.site}</strong> | 총 추천 강좌 수: <strong>{selectedInstructorGroup.lectures.length}개</strong></p>

                  <div className="edu-tip-box">
                    💡 원하시는 강의를 클릭하시면 해당 강의의 상세 설명과 적합한 학생 유형을 확인하실 수 있습니다!
                  </div>

                  {/* Lectures List */}
                  <div className="edu-section">
                    <h4 className="edu-section-title">📚 추천 인강 리스트 ({selectedInstructorGroup.lectures.length}개)</h4>
                    <div>
                      {selectedInstructorGroup.lectures.map((lec, lIdx) => (
                        <div
                          key={lIdx}
                          className="edu-lecture-item"
                          onClick={() => setSelectedLecture(lec)}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                              <span className="edu-level-badge">{lec.level || '일반'}</span>
                              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#e1e2ed' }}>{lec.title}</span>
                            </div>
                            <p style={{ fontSize: '13px', color: '#c2c6d7', margin: 0, lineHeight: '1.4' }}>{lec.description.slice(0, 65)}...</p>
                          </div>
                          <span style={{ fontSize: '13px', color: '#afc6ff', fontWeight: 'bold', whiteSpace: 'nowrap', marginLeft: '12px' }}>상세 분석 ➔</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Books */}
                  <div className="edu-section">
                    <h4 className="edu-section-title">📖 추천 시중 교재 리스트</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedInstructorGroup.recommendedBooks?.map((book, bIdx) => (
                        <div key={bIdx} style={{ backgroundColor: '#191b23', padding: '12px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
                          <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#e1e2ed', margin: '0 0 2px 0' }}>{book.name}</p>
                          <p style={{ fontSize: '12px', color: '#c2c6d7', margin: 0 }}>{book.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lecture Detail Modal */}
            {selectedLecture && (
              <div className="edu-modal-backdrop" style={{ zIndex: 1100 }} onClick={() => setSelectedLecture(null)}>
                <div className="edu-nested-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="edu-modal-header" style={{ marginBottom: '16px' }}>
                    <span className="edu-level-badge" style={{ fontSize: '12px', padding: '4px 10px' }}>{selectedLecture.level || '일반'}</span>
                    <button className="edu-close-btn" onClick={() => setSelectedLecture(null)}>✕</button>
                  </div>

                  <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#e1e2ed', margin: '0 0 16px 0' }}>{selectedLecture.title}</h3>

                  <div style={{ backgroundColor: '#191b23', padding: '16px', borderRadius: '10px', border: '1px solid #334155', marginBottom: '14px' }}>
                    <h5 style={{ fontSize: '12px', fontWeight: 'bold', color: '#afc6ff', textTransform: 'uppercase', margin: '0 0 6px 0' }}>📌 강의 상세 설명</h5>
                    <p style={{ fontSize: '14px', color: '#c2c6d7', margin: 0, lineHeight: '1.6' }}>{selectedLecture.description}</p>
                  </div>

                  <div className="edu-target-box">
                    <h5 style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffb68f', textTransform: 'uppercase', margin: '0 0 6px 0' }}>🎯 이 강의에 가장 적합한 학생 유형</h5>
                    <p style={{ fontSize: '14px', color: '#e1e2ed', margin: 0, lineHeight: '1.6', fontWeight: '500' }}>
                      {selectedLecture.targetStudent || '해당 난이도의 개념을 확실히 다지고 실력을 도약하고 싶은 학생'}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedLecture(null)}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#afc6ff', color: '#002d6d', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    확인 완료
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Board Tab */
          <div className="edu-board-container">
            <div className="edu-hero" style={{ marginBottom: '20px' }}>
              <span className="edu-badge">💬 사용자 의견 및 후기 공유</span>
              <h1 className="edu-title" style={{ fontSize: '28px' }}>학습자 소통 공간</h1>
              <p className="edu-subtitle">
                인강 추천 서비스 이용 후기나 개선 의견을 자유롭게 남겨주세요.
              </p>
            </div>

            {/* Write Form */}
            <form onSubmit={handlePostSubmit} className="edu-board-form">
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#e1e2ed', margin: '0 0 16px 0' }}>✏️ 새로운 의견 남기기</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }} className="form-row">
                <div className="edu-form-group">
                  <label className="edu-form-label">작성자 / 닉네임</label>
                  <input
                    type="text"
                    placeholder="예: 예비고3 학생"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="edu-form-input"
                  />
                </div>
                <div className="edu-form-group">
                  <label className="edu-form-label">글 제목</label>
                  <input
                    type="text"
                    placeholder="제목을 입력하세요"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="edu-form-input"
                  />
                </div>
              </div>
              <div className="edu-form-group">
                <label className="edu-form-label">내용 및 후기</label>
                <textarea
                  placeholder="추천받은 강의 후기나 추가되었으면 하는 기능을 공유해주세요..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="edu-form-textarea"
                />
              </div>
              <button type="submit" className="edu-submit-btn" style={{ width: '100%' }}>
                의견 등록하기
              </button>
            </form>

            {/* Posts List */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#e1e2ed', marginBottom: '16px' }}>
                📋 전체 의견 및 후기 ({posts.length}개)
              </h3>
              <div className="edu-board-list">
                {posts.map((post) => (
                  <div key={post.id} className="edu-post-card">
                    <div className="edu-post-header">
                      <div>
                        <span className="edu-instructor-name" style={{ marginRight: '10px' }}>{post.title}</span>
                        <span className="edu-site-tag">{post.author}</span>
                      </div>
                      <span className="edu-post-date">{post.date}</span>
                    </div>
                    <p className="edu-post-content">{post.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="edu-footer">
        © 2026 EduAI Smart Learning Platform. All rights reserved.
      </footer>
    </div>
  );
}
