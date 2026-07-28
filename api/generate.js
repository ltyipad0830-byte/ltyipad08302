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
    메가스터디, 대성마이맥, EBS, 시대인재 등 주요 플랫폼에 개설된 해당 과목의 **모든 주요 강사(예: 현우진, 배성민, 시대인재 강사진 등)**를 빠짐없이 전부 포함해 주세요.
    
    [핵심 요구사항 - 강의 바로가기 링크 메커니즘]:
    사용자가 제공한 예시처럼, 단순 메인 홈페이지가 아니라 **각 사이트의 공식 통합 검색 및 강좌 검색 결과 페이지 URL**을 생성해야 합니다.
    예를 들어 메가스터디는 https://www.megastudy.net/search_ai/search_main.asp (또는 검색 파라미터가 포함된 URL), 대성마이맥은 대성마이맥 통합 검색 페이지, 시대인재는 시대인재 검색/단과 페이지 등, **해당 강사와 과목/강좌가 바로 검색되어 결과 화면으로 넘어가는 주소**를 각 강좌(lectureUrl)마다 정확하게 매칭해 주세요.
    
    [교재 및 후기 링크]:
    - 'imageUrl': 예스24/알라딘 등의 실제 도서 표지 이미지 URL
    - 'bookStoreUrl': 예스24 도서 상세 검색/구매 페이지 URL
    - 'reviewLinks': 해당 플랫폼의 강사 수강평 및 커뮤니티 수강 후기 페이지 URL

    반드시 아래의 JSON 배열 형식으로만 반환해 주세요. 다른 설명이나 마크다운 서식은 절대 포함하지 마세요.
    
    [
      {
        "site": "메가스터디",
        "instructor": "현우진",
        "mainFeature": "수학의 1타 강사, 수능/내신 완벽 대비 전체 커리큘럼",
        "lectures": [
          {
            "title": "현우진 미적분 강좌 전체",
            "description": "메가스터디에서 현우진 강사의 미적분 전체 강좌 검색 결과",
            "lectureUrl": "https://www.megastudy.net/search_ai/search_main.asp"
          }
        ],
        "recommendedBooks": [
          {
            "name": "쎈 미적분",
            "reason": "미적분 필수 유형 학습을 위한 대표 시중 교재",
            "imageUrl": "https://image.yes24.com/goods/102345678/L",
            "bookStoreUrl": "https://www.yes24.com/Product/Search?domain=ALL&query=쎈+미적분"
          }
        ],
        "reviewLinks": [
          {
            "platformName": "메가스터디 현우진 수강후기",
            "url": "https://www.megastudy.net/teacher_v2/eval/eval_list.asp?tec_cd=woojin"
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
