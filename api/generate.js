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
    메가스터디, 대성마이맥, EBS, 시대인재 등 각 인강 사이트마다 해당 과목을 강의하는 **여러 명의 주요 강사(최소 사이트당 2~3명 이상, 예: 메가스터디의 현우진, 김기현, 정승제 등 / 대성마이맥의 배성민, 한석원, 이창무 등 / 시대인재 등)**를 누락 없이 전부 포함해 주세요.
    그리고 **각 강사별로 난이도별(입문, 기본, 실전, 고난도 등)로 여러 개의 강좌(최소 2~4개 이상)**를 각각 상세하게 배열에 담아주세요. 단 한 명의 강사나 한 개의 인강만 보여주면 절대 안 됩니다.

    [필수 규칙 - 링크 및 상세 페이지 연동]:
    1. 'lectureUrl': 각 사이트의 메인 홈페이지가 아니라, 해당 강사의 전용 강의 검색 결과 페이지 또는 강좌 상세 페이지(예: 메가스터디 통합 검색 URL 또는 강사별 상세 강의 페이지)를 매칭하세요.
    2. 'bookStoreUrl': 사용자가 언급한 것처럼 단순히 예스24 메인이 아니라, 해당 시중 교재의 정확한 상세 도서 페이지 URL(예: https://www.yes24.com/product/goods/167508612 형식의 실제 상품 고유 번호가 포함된 상세 구매 URL)을 반드시 제공하세요.
    3. 'imageUrl': 해당 교재의 실제 표지 이미지 고화질 URL을 매칭하세요.
    4. 'reviewLinks': 해당 강사 및 강좌의 실제 수강평, 평점, 수능 커뮤니티 후기 페이지 URL을 제공하세요.

    반드시 아래의 JSON 배열 형식으로만 반환해 주세요. 다른 설명이나 마크다운 서식은 절대 포함하지 마세요.
    
    [
      {
        "site": "메가스터디",
        "instructor": "현우진",
        "mainFeature": "수학 1타 강사, 개념부터 고난도 킬러 문항까지 완벽 마스터",
        "lectures": [
          {
            "title": "시발점",
            "level": "입문/개념",
            "description": "수학의 기초 개념을 탄탄하게 다지는 필수 입문 강좌",
            "lectureUrl": "https://www.megastudy.net/search_ai/search_main.asp"
          },
          {
            "title": "뉴맵 (New M)",
            "level": "실전/심화",
            "description": "수능적 사고력과 실전 문제 해결 능력을 기르는 대표 강좌",
            "lectureUrl": "https://www.megastudy.net/search_ai/search_main.asp"
          }
        ],
        "recommendedBooks": [
          {
            "name": "쎈 수학",
            "reason": "다양한 난이도별 유형 문제를 통해 개념을 확실히 체화하는 교재",
            "imageUrl": "https://image.yes24.com/goods/167508612/L",
            "bookStoreUrl": "https://www.yes24.com/product/goods/167508612"
          }
        ],
        "reviewLinks": [
          {
            "platformName": "메가스터디 현우진 수강생 평점 및 후기",
            "url": "https://www.megastudy.net"
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
