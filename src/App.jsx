import React, { useState } from 'react';

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

  const getSiteBadgeStyle = (site) => {
    let bg = '#e6f0ff';
    let color = '#0066ff';
    if (site.includes('메가')) { bg = '#ffe6e6'; color = '#ff3333'; }
    else if (site.includes('대성')) { bg = '#fff3e6'; color = '#ff8800'; }
    else if (site.includes('EBS')) { bg = '#e6f7ff'; color = '#0088cc'; }
    else if (site.includes('시대')) { bg = '#f2e6ff'; color = '#7700ff'; }
    
    return {
      ...styles.siteBadge,
      backgroundColor: bg,
      color: color,
    };
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <span style={styles.badgeTop}>✨ 22개정 대규모 인강 및 맞춤형 대상 분석 플랫폼</span>
          <h1 style={styles.title}>사이트별 모든 강사진 & 수많은 인강 전면 비교</h1>
          <p style={styles.subtitle}>메가스터디 등 모든 강사진의 수십 개 인강 추천 및 각 강의를 클릭하면 상세 설명과 적합한 학생 유형을 확인 가능</p>
        </header>

        <form onSubmit={handleSearch} style={styles.formContainer}>
          <div style={styles.inputWrapper}>
            <input
              type="text"
              placeholder="예: 미적분, 공통수학2, 수학(상) 등 입력"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={styles.input}
            />
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? '⏳ 대규모 강사진 분석 중...' : '전체 강사 및 인강 조회'}
            </button>
          </div>
        </form>

        {error && <div style={styles.errorBox}>{error}</div>}

        {loading && (
          <div style={styles.loadingContainer}>
            <p style={styles.loadingText}>모든 사이트의 수많은 강사진과 수십 개에 이르는 난이도별 인강, 적합한 학생 유형을 정밀 분석 중입니다...</p>
          </div>
        )}

        <div style={styles.resultsGrid}>
          {results.map((group, index) => (
            <div 
              key={index} 
              style={styles.card}
              onClick={() => {
                setSelectedInstructorGroup(group);
                setSelectedLecture(null);
              }}
            >
              <div style={styles.cardHeader}>
                <span style={getSiteBadgeStyle(group.site)}>{group.site}</span>
                <span style={styles.instructorTag}>{group.instructor} 강사</span>
              </div>
              <h3 style={styles.lectureTitle}>{group.instructor} 강사의 개설 인강 ({group.lectures.length}개)</h3>
              <p style={styles.feature}>{group.mainFeature || '다양한 난이도별 맞춤형 커리큘럼 제공'}</p>
              <div style={styles.cardFooter}>
                <span style={styles.detailClickHint}>🔍 모든 강좌 & 맞춤 대상 보기</span>
              </div>
            </div>
          ))}
        </div>

        {/* 강사별 상세 모달 영역 */}
        {selectedInstructorGroup && (
          <div style={styles.modalOverlay} onClick={() => setSelectedInstructorGroup(null)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <span style={getSiteBadgeStyle(selectedInstructorGroup.site)}>{selectedInstructorGroup.site}</span>
                <button style={styles.closeButton} onClick={() => setSelectedInstructorGroup(null)}>✕</button>
              </div>
              
              <h2 style={styles.modalTitle}>{selectedInstructorGroup.instructor} 강사 추천 인강 목록</h2>
              <p style={styles.modalInstructor}>소속 플랫폼: <strong>{selectedInstructorGroup.site}</strong> | 총 추천 강좌 수: <strong>{selectedInstructorGroup.lectures.length}개</strong></p>
              <p style={styles.clickGuideText}>💡 <strong>원하시는 강의를 클릭하시면</strong> 해당 강의의 상세 설명과 적합한 학생 유형을 확인하실 수 있습니다!</p>

              {/* 강사의 수많은 인강 목록 */}
              <div style={styles.sectionBox}>
                <h4 style={styles.sectionHeading}>📚 추천 인강 리스트 (클릭 가능)</h4>
                <div style={styles.lecturesListContainer}>
                  {selectedInstructorGroup.lectures.map((lec, lIdx) => (
                    <div 
                      key={lIdx} 
                      style={styles.lectureItemBoxClickable}
                      onClick={() => setSelectedLecture(lec)}
                    >
                      <div style={styles.lecItemTop}>
                        <h5 style={styles.lecItemTitle}>[{lec.level || '일반'}] {lec.title}</h5>
                        <span style={styles.clickBadge}>상세 설명 보기 ↗</span>
                      </div>
                      <p style={styles.lecItemDesc}>{lec.description.slice(0, 60)}...</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 시중 교재 추천 리스트 */}
              <div style={styles.sectionBox}>
                <h4 style={styles.sectionHeading}>📖 추천 시중 교재 리스트 (쎈, 블랙라벨, 개념원리 등)</h4>
                <div style={styles.booksGrid}>
                  {selectedInstructorGroup.recommendedBooks && selectedInstructorGroup.recommendedBooks.map((book, bIdx) => (
                    <div key={bIdx} style={styles.bookCardTextOnly}>
                      <div style={styles.bookTitleRow}>
                        <p style={styles.bookName}><strong>{book.name}</strong></p>
                      </div>
                      <p style={styles.bookReason}>{book.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 개별 강의 클릭 시 뜨는 상세 설명 및 적합한 학생 모달 */}
        {selectedLecture && (
          <div style={styles.modalOverlayNested} onClick={() => setSelectedLecture(null)}>
            <div style={styles.modalContentNested} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <span style={styles.nestedBadge}>인강 상세 분석</span>
                <button style={styles.closeButton} onClick={() => setSelectedLecture(null)}>✕</button>
              </div>

              <h2 style={styles.nestedTitle}>[{selectedLecture.level || '일반'}] {selectedLecture.title}</h2>
              
              <div style={styles.nestedSection}>
                <h4 style={styles.nestedSubHeading}>📌 강의 상세 설명</h4>
                <p style={styles.nestedText}>{selectedLecture.description}</p>
              </div>

              <div style={styles.nestedSectionTarget}>
                <h4 style={styles.nestedSubHeadingTarget}>🎯 이 강의에 가장 적합한 학생 유형</h4>
                <p style={styles.nestedTextTarget}>{selectedLecture.targetStudent || '해당 난이도의 개념을 확실히 다지고 실력을 도약하고 싶은 학생'}</p>
              </div>

              <button style={styles.nestedCloseBtn} onClick={() => setSelectedLecture(null)}>확인 완료</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  badgeTop: {
    display: 'inline-block',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: '#ffffff',
    color: '#0066ff',
    borderRadius: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    marginBottom: '12px',
  },
  title: {
    fontSize: '32px',
    color: '#1a1a1a',
    fontWeight: '800',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#555',
  },
  formContainer: {
    marginBottom: '40px',
  },
  inputWrapper: {
    display: 'flex',
    background: '#ffffff',
    padding: '8px',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    gap: '10px',
  },
  input: {
    flex: 1,
    padding: '14px 20px',
    fontSize: '16px',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
  },
  button: {
    padding: '14px 28px',
    fontSize: '16px',
    backgroundColor: '#0066ff',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#ffebe6',
    color: '#ff4d4f',
    padding: '14px',
    borderRadius: '10px',
    textAlign: 'center',
    marginBottom: '20px',
    fontWeight: '500',
    wordBreak: 'break-all',
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '40px',
    color: '#444',
    fontSize: '16px',
    fontWeight: '500',
  },
  resultsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '2px solid transparent',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 6px 16px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  siteBadge: {
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '700',
    borderRadius: '6px',
  },
  instructorTag: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#444',
  },
  lectureTitle: {
    fontSize: '17px',
    color: '#111',
    fontWeight: '700',
    margin: '0 0 10px 0',
    lineHeight: '1.4',
  },
  feature: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 15px 0',
    lineHeight: '1.5',
  },
  cardFooter: {
    borderTop: '1px solid #f0f0f0',
    paddingTop: '12px',
    textAlign: 'right',
  },
  detailClickHint: {
    fontSize: '13px',
    color: '#0066ff',
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    maxWidth: '750px',
    width: '100%',
    padding: '30px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '22px',
    cursor: 'pointer',
    color: '#888',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#111',
    margin: '0 0 6px 0',
  },
  modalInstructor: {
    fontSize: '15px',
    color: '#555',
    marginBottom: '10px',
  },
  clickGuideText: {
    fontSize: '13px',
    color: '#0066ff',
    backgroundColor: '#eff6ff',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  sectionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    border: '1px solid #e2e8f0',
  },
  sectionHeading: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 12px 0',
  },
  lecturesListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  lectureItemBoxClickable: {
    backgroundColor: '#fff',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  lecItemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  lecItemTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  clickBadge: {
    fontSize: '12px',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: '600',
  },
  lecItemDesc: {
    fontSize: '13px',
    color: '#475569',
    margin: 0,
    lineHeight: '1.5',
  },
  booksGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  bookCardTextOnly: {
    backgroundColor: '#fff',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
  },
  bookTitleRow: {
    marginBottom: '4px',
  },
  bookName: {
    fontSize: '14px',
    color: '#0f172a',
    margin: 0,
  },
  bookReason: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.4',
  },
  modalOverlayNested: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1100,
    padding: '20px',
  },
  modalContentNested: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    maxWidth: '600px',
    width: '100%',
    padding: '30px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
  },
  nestedBadge: {
    fontSize: '12px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '4px 10px',
    borderRadius: '6px',
    fontWeight: '700',
  },
  nestedTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '15px 0 20px 0',
  },
  nestedSection: {
    backgroundColor: '#f8fafc',
    padding: '14px',
    borderRadius: '10px',
    marginBottom: '14px',
    border: '1px solid #e2e8f0',
  },
  nestedSectionTarget: {
    backgroundColor: '#ecfdf5',
    padding: '14px',
    borderRadius: '10px',
    marginBottom: '24px',
    border: '1px solid #a7f3d0',
  },
  nestedSubHeading: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#334155',
    margin: '0 0 6px 0',
  },
  nestedSubHeadingTarget: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#065f46',
    margin: '0 0 6px 0',
  },
  nestedText: {
    fontSize: '14px',
    color: '#475569',
    margin: 0,
    lineHeight: '1.6',
  },
  nestedTextTarget: {
    fontSize: '14px',
    color: '#047857',
    margin: 0,
    lineHeight: '1.6',
    fontWeight: '500',
  },
  nestedCloseBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#0066ff',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};
