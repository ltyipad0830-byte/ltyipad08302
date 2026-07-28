import React, { useState } from 'react';

export default function App() {
  const [subject, setSubject] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLecture, setSelectedLecture] = useState(null); // 모달용 선택된 강의

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject }),
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
          <span style={styles.badgeTop}>✨ 22개정 교육과정 맞춤</span>
          <h1 style={styles.title}>인강 & 연계 시중교재 통합 비교 플랫폼</h1>
          <p style={styles.subtitle}>원하는 인강을 클릭하여 상세 설명, 강의 링크, 추천 교재를 확인하세요</p>
        </header>

        <form onSubmit={handleSearch} style={styles.formContainer}>
          <div style={styles.inputWrapper}>
            <input
              type="text"
              placeholder="예: 공통국어1, 수학(상), 통합사회 등 과목 입력"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={styles.input}
            />
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? '⏳ 분석 중...' : '인강 찾기'}
            </button>
          </div>
        </form>

        {error && <div style={styles.errorBox}>{error}</div>}

        {loading && (
          <div style={styles.loadingContainer}>
            <p style={styles.loadingText}>Gemini가 최적의 인강과 시중교재를 분석 중입니다...</p>
          </div>
        )}

        <div style={styles.resultsGrid}>
          {results.map((item, index) => (
            <div 
              key={index} 
              style={styles.card}
              onClick={() => setSelectedLecture(item)}
            >
              <div style={styles.cardHeader}>
                <span style={getSiteBadgeStyle(item.site)}>{item.site}</span>
                <span style={styles.instructorTag}>{item.instructor} 강사</span>
              </div>
              <h3 style={styles.lectureTitle}>{item.title}</h3>
              <p style={styles.feature}>{item.feature}</p>
              <div style={styles.cardFooter}>
                <span style={styles.detailLinkText}>📖 상세 설명 및 교재 보기 &rarr;</span>
              </div>
            </div>
          ))}
        </div>

        {/* 상세 정보 모달 */}
        {selectedLecture && (
          <div style={styles.modalOverlay} onClick={() => setSelectedLecture(null)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <span style={getSiteBadgeStyle(selectedLecture.site)}>{selectedLecture.site}</span>
                <button style={styles.closeButton} onClick={() => setSelectedLecture(null)}>✕</button>
              </div>
              <h2 style={styles.modalTitle}>{selectedLecture.title}</h2>
              <p style={styles.modalInstructor}><strong>담당 강사:</strong> {selectedLecture.instructor}</p>
              
              <div style={styles.sectionBox}>
                <h4 style={styles.sectionHeading}>📝 강의 상세 설명</h4>
                <p style={styles.sectionText}>{selectedLecture.description || selectedLecture.feature}</p>
              </div>

              <div style={styles.sectionBox}>
                <h4 style={styles.sectionHeading}>📚 함께 풀면 좋은 추천 시중교재</h4>
                <p style={styles.bookText}>{selectedLecture.recommendedBook || "이 강의와 병행하기 좋은 연계 교재 정보가 준비되어 있습니다."}</p>
              </div>

              <div style={styles.linkBox}>
                <a 
                  href={selectedLecture.link || "https://www.google.com/search?q=" + encodeURIComponent(selectedLecture.site + " " + selectedLecture.instructor + " " + selectedLecture.title)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={styles.externalLinkButton}
                >
                  🔗 인강 사이트 바로가기
                </a>
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
    maxWidth: '900px',
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid rgba(255,255,255,0.8)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 6px 16px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
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
    fontSize: '16px',
    color: '#111',
    fontWeight: '700',
    margin: '0 0 10px 0',
    lineHeight: '1.4',
  },
  feature: {
    fontSize: '14px',
    color: '#666',
    margin: '0 0 16px 0',
    lineHeight: '1.5',
  },
  cardFooter: {
    borderTop: '1px solid #f0f0f0',
    paddingTop: '12px',
  },
  detailLinkText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0066ff',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    maxWidth: '550px',
    width: '100%',
    padding: '30px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    position: 'relative',
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
    fontSize: '20px',
    cursor: 'pointer',
    color: '#888',
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#111',
    margin: '0 0 10px 0',
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
    fontSize: '15px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
  },
  sectionText: {
    fontSize: '14px',
    color: '#475569',
    margin: 0,
    lineHeight: '1.6',
  },
  bookText: {
    fontSize: '14px',
    color: '#0f766e',
    fontWeight: '600',
    margin: 0,
    lineHeight: '1.6',
  },
  linkBox: {
    marginTop: '20px',
    textAlign: 'center',
  },
  externalLinkButton: {
    display: 'inline-block',
    width: '100%',
    padding: '14px',
    backgroundColor: '#0066ff',
    color: '#fff',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '16px',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0,102,255,0.3)',
  },
};
