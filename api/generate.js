const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subject } = req.body;

  if (!subject) {
    return res.status(400).json({ error: '과목명을 입력해주세요.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' 
    });
  }

  const modelsToTry = ["gemini-3.1-flash-lite", "gemini-1.5-flash", "gemini-2.0-flash"];
  let lastError = null;

  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `
    22개정 교육과정에 맞춰 학생들이 "${subject}" 과목의 인강을 찾고 있습니다.
    메가스터디, 대성마이맥, EBS, 시대인재 등 주요 플랫폼에 개설된 해당 과목의 **모든 주요 강사(예: 현우진, 한석원, 배성민 등 모든 강사)**를 빠짐없이 전부 포함해 주세요.
    각 강사별로 개설된 모든 주요 강좌들을 누락 없이 배열에 담아주세요.
    
    [중요 규칙 - 링크 및 이미지 일관성 확보]:
    1. 'lectureUrl'과 'bookStoreUrl', 'reviewLink'는 절대 무작위거나 깨진 링크여서는 안 되며, 각 플랫폼의 공식 메인 주소 또는 검증된 공인 도서 판매처(예스24 공식 도서 검색 등)의 안정적인 URL을 제공해 주세요.
    2. 'imageUrl'은 실제 서점에 등록된 해당 교재의 신뢰할 수 있는 대표 커버 이미지 URL(예스24/알라딘 등의 안정적인 이미지 주소 또는 Unsplash의 고정적이고 직관적인 도서/학습 관련 대표 고화질 이미지 URL)을 고정하여 재검색 시에도 이미지가 바뀌지 않고 일관되게 출력되도록 하세요.
    3. 동일한 과목을 다시 검색했을 때 항상 완전히 동일하고 정확한 데이터 구조가 반환되도록 고정적인 표준 데이터셋을 구성해 주세요.

    반드시 아래의 JSON 배열 형식으로만 반환해 주세요. 다른 설명이나 마크다운 서식은 절대 포함하지 마세요.
    
    [
      {
        "site": "메가스터디",
        "instructor": "현우진",
        "mainFeature": "수학의 1타 강사, 수능/내신 완벽 대비 전체 커리큘럼",
        "lectures": [
          {
            "title": "시발점 수학",
            "description": "수학의 개념을 완벽하게 다지는 필수 입문 강좌",
            "lectureUrl": "https://www.megastudy.net"
          },
          {
            "title": "뉴맵 (New M)",
            "description": "수능적 사고를 기르는 대표 실전 개념 강좌",
            "lectureUrl": "https://www.megastudy.net"
          }
        ],
        "recommendedBooks": [
          {
            "name": "시발점 교재",
            "reason": "현우진 강사 직강 교재로 개념 정리에 최적화",
            "imageUrl": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200",
            "bookStoreUrl": "https://www.yes24.com"
          },
          {
            "name": "쎈 수학",
            "reason": "다양한 유형의 문제를 통해 개념을 확실히 다지는 필수 연계 교재",
            "imageUrl": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200",
            "bookStoreUrl": "https://www.yes24.com"
          }
        ],
        "reviewLinks": [
          {
            "platformName": "메가스터디 공식 수강후기 게시판",
            "url": "https://www.megastudy.net"
          },
          {
            "platformName": "수능 커뮤니티(오르비) 생생 후기",
            "url": "https://orbi.kr"
          }
        ]
      }
    ]
  `;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      let textResponse = result.response.text().trim();
      textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

      const data = JSON.parse(textResponse);
      return res.status(200).json({ results: data });
    } catch (err) {
      console.warn(`Model ${modelName} failed:`, err.message);
      lastError = err;
    }
  }

  return res.status(500).json({ 
    error: 'Gemini 모델 호출 중 오류가 발생했습니다. 상세 오류: ' + (lastError ? lastError.message : '알 수 없는 오류') 
  });
};
