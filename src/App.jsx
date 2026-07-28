import React, { useState } from 'react';

export default function App() {
  const [subject, setSubject] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedInstructorGroup, setSelectedInstructorGroup] = useState(null);

  const [cache, setCache] = useState({});

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmedSubject = subject.trim();
    if (!trimmedSubject) return;

    setSelectedInstructorGroup(null);

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
          <span style={styles.badgeTop}>✨ 22개정 교육과정 다중 강사 및 정밀 연동 플랫폼</span>
          <h1 style={styles.title}>사이트별 복수 강사 & 난이도별 인강 전면 비교</h1>
          <p style={styles.subtitle}>사이트마다 여러 강사진과 다양한 난이도별 강좌, 실제 도서 상세 구매처 및 수강 후기 직링크 연동</p>
        </header>

        <form onSubmit={handleSearch} style={styles.formContainer}>
          <div style={styles.inputWrapper}>
            <input
              type="text"
              placeholder="예: 공통수학2, 미적분, 수학(상) 등 입력"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={styles.input}
            />
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? '⏳ 다중 강사 분석 중...' : '전체 강사 조회'}
            </button>
          </div>
        </form>

        {error && <div style={styles.errorBox}>{error}</div>}

        {loading && (
          <div style={styles.loadingContainer}>
            <p style={styles.loadingText}>각 사이트별 여러 강사진과 난이도별 인강, 정밀 도서 상세 페이지를 수집 중입니다...</p>
          </div>
        )}

        <div style={styles.resultsGrid}>
          {results.map((group, index) => (
            <div 
              key={index} 
              style={styles.card}
              onClick={() => setSelectedInstructorGroup(group)}
            >
              <div style={styles.cardHeader}>
                <span style={getSiteBadgeStyle(group.site)}>{group.site}</span>
                <span style={styles.instructorTag}>{group.instructor} 강사</span>
              </div>
              <h3 style={styles.lectureTitle}>{group.instructor} 강사 ({group.lectures.length}개 강좌)</h3>
              <p style={styles.feature}>{group.mainFeature || '난이도별 맞춤형 커리큘럼 및 전용 교재 완비'}</p>
              <div style={styles.cardFooter}>
                <span style={styles.detailClickHint}>🔍 모든 강좌 & 교재 & 후기 보기</span>
              </div>
            </div>
          ))}
        </div>

        {/* 상세 모달 영역 */}
        {selectedInstructorGroup && (
          <div style={styles.modalOverlay} onClick={() => setSelectedInstructorGroup(null)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <span style={getSiteBadgeStyle(selectedInstructorGroup.site)}>{selectedInstructorGroup.site}</span>
                <button style={styles.closeButton} onClick={() => setSelectedInstructorGroup(null)}>✕</button>
              </div>
              
              <h2 style={styles.modalTitle}>{selectedInstructorGroup.instructor} 강사 통합 정보</h2>
              <p style={styles.modalInstructor}>소속 플랫폼: <strong>{selectedInstructorGroup.site}</strong></p>

              {/* 1. 해당 강사의 모든 인강 목록 및 난이도별 커리큘럼 */}
              <div style={styles.sectionBox}>
                <h4 style={styles.sectionHeading}>📚 난이도별 개설된 전체 인강 목록</h4>
                <div style={styles.lecturesListContainer}>
                  {selectedInstructorGroup.lectures.map((lec, lIdx) => (
                    <div key={lIdx} style={styles.lectureItemBox}>
                      <div style={styles.lecItemTop}>
                        <h5 style={styles.lecItemTitle}>[{lec.level || '일반'}] {lec.title}</h5>
                        <a 
                          href={lec.lectureUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={styles.lecDirectLinkBtn}
                        >
                          강의 바로가기 ↗
                        </a>
                      </div>
                      <p style={styles.lecItemDesc}>{lec.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. 실제 시중 교재 사진 및 상세 구매처 */}
              <div style={styles.sectionBox}>
                <h4 style={styles.sectionHeading}>📖 추천 시중 교재 (상세 구매처 연동)</h4>
                <div style={styles.booksGrid}>
                  {selectedInstructorGroup.recommendedBooks && selectedInstructorGroup.recommendedBooks.map((book, bIdx) => (
                    <div key={bIdx} style={styles.bookCard}>
                      <img 
                        src={book.imageUrl} 
                        alt={book.name} 
                        style={styles.bookImage}
                        onError={(e) => { e.target.src = 'https://image.yes24.com/goods/167508612/L'; }}
                      />
                      <div style={styles.bookInfo}>
                        <div style={styles.bookTitleRow}>
                          <p style={styles.bookName}><strong>{book.name}</strong></p>
                          <a href={book.bookStoreUrl} target="_blank" rel="noopener noreferrer" style={styles.bookStoreLink}>교재 상세 구매처 ↗</a>
                        </div>
                        <p style={styles.bookReason}>{book.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. 실제 수강 후기 모음 링크 */}
              <div style={styles.sectionBox}>
                <h4 style={styles.sectionHeading}>⭐ 수강생 생생 후기</h4>
                <p style={styles.reviewSubText}>해당 강사 및 강좌들에 대한 수강생들의 실제 평점과 합격 후기를 직접 확인할 수 있습니다.</p>
                <div style={styles.reviewLinksContainer}>
                  {selectedInstructorGroup.reviewLinks && selectedInstructorGroup.reviewLinks.map((rev, rIdx) => (
                    <a 
                      key={rIdx} 
                      href={rev.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={styles.reviewLinkBadge}
                    >
                      💬 {rev.platformName} ↗
                    </a>
                  ))}
                </div>
              </div>
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
  lectureItemBox: {
    backgroundColor: '#fff',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
  },
  lecItemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  lecItemTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  lecDirectLinkBtn: {
    fontSize: '12px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '4px 10px',
    borderRadius: '6px',
    textDecoration: 'none',
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
    gap: '12px',
  },
  bookCard: {
    display: 'flex',
    gap: '14px',
    backgroundColor: '#fff',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    alignItems: 'center',
  },
  bookImage: {
    width: '65px',
    height: '90px',
    objectFit: 'cover',
    borderRadius: '6px',
    backgroundColor: '#e2e8f0',
    flexShrink: 0,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  bookName: {
    fontSize: '14px',
    color: '#0f172a',
    margin: 0,
  },
  bookStoreLink: {
    fontSize: '11px',
    color: '#0284c7',
    textDecoration: 'none',
    fontWeight: '600',
  },
  bookReason: {
    fontSize: '13px',
    color: '#64748b',
    margin: '0',
    lineHeight: '1.4',
  },
  reviewSubText: {
    fontSize: '13px',
    color: '#64748b',
    margin: '0 0 10px 0',
  },
  reviewLinksContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  reviewLinkBadge: {
    display: 'inline-block',
    backgroundColor: '#ecfdf5',
    color: '#059669',
    padding: '10px 14px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '13px',
    border: '1px solid #a7f3d0',
  },
};
