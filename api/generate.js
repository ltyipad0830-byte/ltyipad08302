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
    22개정 교육과정에 맞춰 학생들이 "${subject}" 과목의 인강과 시중 교재를 찾고 있습니다.
    
    [핵심 요구사항 1: 사이트별 모든 복수 강사진 전원 포함]
    - 메가스터디의 경우 언급하신 이승효, 장영진, 현우진, 장미리 강사를 포함하여 해당 과목을 강의하는 **모든 주요 강사진(최소 4~5명 이상)**을 빠짐없이 각각의 객체로 분리하여 전부 포함해 주세요.
    - 대성마이맥(배성민, 한석원, 이창무, 정상모 등), EBS(다수 강사진), 시대인재 등 다른 사이트도 각각 여러 명의 강사진을 모두 포함해 주세요. 단 한 명만 보여주면 절대 안 됩니다.

    [핵심 요구사항 2: 난이도별 복수 인강 제공]
    - 각 강사마다 입문, 기본, 심화, 실전 등 **난이도별로 여러 개의 강좌(최소 2~4개 이상)**를 각각 상세하게 배열에 담아주세요.

    [핵심 요구사항 3: 시중 교재(쎈, 블랙라벨, 개념원리 등) 다수 추천 및 사진 제거]
    - 인강 전용 교재가 아니라, 학생들이 잘 알고 있는 **시중 유명 교재들(쎈, 블랙라벨, 개념원리, 수학의 바이블, 자이스토리, 마더텅 등)** 중 해당 과목에 적합한 교재들을 **여러 개(최소 2~4개 이상)** 추천해 주세요.
    - 교재 사진은 완전히 제거되었으므로, 교재 이름, 추천 이유, 그리고 예스24 등의 상세 구매 링크(예: https://www.yes24.com/product/goods/167508612 등)를 텍스트로 정확히 제공해 주세요.

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
            "description": "수학적 사고력과 실전 문제 해결 능력을 기르는 대표 강좌",
            "lectureUrl": "https://www.megastudy.net/search_ai/search_main.asp"
          }
        ],
        "recommendedBooks": [
          {
            "name": "쎈 수학",
            "reason": "다양한 난이도별 유형 문제를 통해 개념을 확실히 체화하는 필수 시중 교재",
            "bookStoreUrl": "https://www.yes24.com/product/goods/167508612"
          },
          {
            "name": "블랙라벨 수학",
            "reason": "최상위권 도약을 위한 고난도 변별력 문항 집중 학습 교재",
            "bookStoreUrl": "https://www.yes24.com/product/goods/102345678"
          },
          {
            "name": "개념원리",
            "reason": "수학의 기본 원리를 가장 쉽고 자세하게 설명하는 스테디셀러 교재",
            "bookStoreUrl": "https://www.yes24.com/product/goods/107890123"
          }
        ],
        "reviewLinks": [
          {
            "platformName": "메가스터디 현우진 수강생 평점 및 후기",
            "url": "https://www.megastudy.net"
          }
        ]
      },
      {
        "site": "메가스터디",
        "instructor": "이승효",
        "mainFeature": "탄탄한 논리 전개와 실전 개념 중심의 명쾌한 강의",
        "lectures": [
          {
            "title": "이승효 개념 완성 강좌",
            "level": "기본/개념",
            "description": "교과 개념을 완벽하게 이해하고 응용력을 기르는 강좌",
            "lectureUrl": "https://www.megastudy.net/search_ai/search_main.asp"
          }
        ],
        "recommendedBooks": [
          {
            "name": "쎈 수학",
            "reason": "유형별 문제 해결력을 기르기 좋은 베스트셀러",
            "bookStoreUrl": "https://www.yes24.com/product/goods/167508612"
          },
          {
            "name": "개념원리",
            "reason": "기초 다지기에 탁월한 입문 교재",
            "bookStoreUrl": "https://www.yes24.com/product/goods/107890123"
          }
        ],
        "reviewLinks": [
          {
            "platformName": "메가스터디 이승효 수강평 게시판",
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
    error: 'Gemini 모델 호출 중 오류가 질문하신 내용에 대한 처리를 완료했습니다. 상세 오류: ' + (lastError ? lastError.message : '알 수 없는 오류') 
  });
};
