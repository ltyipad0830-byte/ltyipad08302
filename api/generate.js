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
    
    [핵심 요구사항 1: 모든 사이트의 대규모 복수 강사진 전원 포함]
    - 메가스터디의 경우 언급하신 이승효, 장영진, 현우진, 장미리 강사를 포함하여 해당 과목을 강의하는 모든 주요 강사진(최소 5~6명 이상)을 빠짐없이 각각 독립된 객체로 생성해 주세요.
    - 대성마이맥(배성민, 한석원, 이창무, 정상모 등), EBS 등 다른 주요 사이트의 강사진들도 빠짐없이 각각 포함해 주세요. 절대 1~2명만 보여주지 마세요.

    [핵심 요구사항 2: 강사별로 풍부하고 수많은 인강 리스트 제공 (최소 5~8개 이상)]
    - 각 강사마다 입문, 기본, 응용, 실전, 고난도 심화, 파이널 등 난이도별로 매우 다양한 인강 목록을 풍부하게(각 강사당 5개 이상의 강좌) 상세히 작성해 주세요. 

    [핵심 요구사항 3: 시중 교재(쎈, 블랙라벨, 개념원리 등) 다수 추천]
    - 쎈, 블랙라벨, 개념원리, 수학의 바이블, 자이스토리, 마더텅 등 학생들이 사용하는 대표적인 시중 교재들을 여러 개 추천해 주세요.

    [핵심 요구사항 4: 링크 및 후기 전면 제거]
    - 'lectureUrl', 'bookStoreUrl', 'reviewLinks' 등 모든 외부 바로가기 링크와 수강 후기 항목은 아예 만들지 마세요. 오직 추천 인강 목록, 난이도, 설명, 시중 교재 추천 목록만 순수 텍스트로 구성하세요.

    반드시 아래의 JSON 배열 형식으로만 반환해 주세요. 다른 설명이나 마크다운 서식은 절대 포함하지 마세요.
    
    [
      {
        "site": "메가스터디",
        "instructor": "현우진",
        "mainFeature": "수학 1타 강사, 개념부터 고난도 킬러 문항까지 완벽 마스터하는 방대한 커리큘럼",
        "lectures": [
          { "title": "시발점", "level": "입문/개념", "description": "수학의 기초 개념을 탄탄하게 다지는 필수 입문 강좌" },
          { "title": "수학의 원리", "level": "기본", "description": "교과서 중심의 기본기를 완성하는 강좌" },
          { "title": "뉴맵 (New M)", "level": "실전/심화", "description": "수능적 사고력과 실전 문제 해결 능력을 기르는 대표 강좌" },
          { "title": "킬링캠프", "level": "고난도/모의고사", "description": "최상위권 도약을 위한 고난도 실전 모의고사 강좌" },
          { "title": "수행평가 및 내신 대비 특강", "level": "내신", "description": "학교 시험 서술형 및 빈출 유형 완벽 대비" }
        ],
        "recommendedBooks": [
          { "name": "쎈 수학", "reason": "다양한 난이도별 유형 문제를 통해 개념을 체화하는 필수 교재" },
          { "name": "블랙라벨 수학", "reason": "최상위권 변별력 문항 집중 학습 교재" },
          { "name": "개념원리", "reason": "수학 기본 원리를 가장 쉽게 설명하는 스테디셀러" }
        ]
      },
      {
        "site": "메가스터디",
        "instructor": "이승효",
        "mainFeature": "탄탄한 논리 전개와 실전 개념 중심의 명쾌한 강의 라인업",
        "lectures": [
          { "title": "이승효 개념 완성", "level": "기본/개념", "description": "교과 개념을 완벽하게 이해하고 응용력을 기르는 강좌" },
          { "title": "이승효 유형 정복", "level": "응용/유형", "description": "핵심 기출 유형을 마스터하는 실전 강좌" },
          { "title": "이승효 고난도 심화", "level": "고난도", "description": "준킬러 및 킬러 문항 돌파를 위한 심화 강좌" },
          { "title": "이승효 파이널 모의고사", "level": "실전/파이널", "description": "수능 및 평가원 완벽 대비 파이널 강좌" }
        ],
        "recommendedBooks": [
          { "name": "쎈 수학", "reason": "유형별 문제 해결력을 기르기 좋은 베스트셀러" },
          { "name": "개념원리", "reason": "기초 다지기에 탁월한 입문 교재" }
        ]
      },
      {
        "site": "메가스터디",
        "instructor": "장영진",
        "mainFeature": "직관적이고 명쾌한 해법을 제시하는 수학 전문가",
        "lectures": [
          { "title": "장영진 개념의 시작", "level": "입문/개념", "description": "명확하고 간결한 개념 정리 강좌" },
          { "title": "장영진 문제해결 전략", "level": "실전", "description": "실전 문제 적용 능력을 극대화하는 강좌" },
          { "title": "장영진 실전 모의고사", "level": "파이널", "description": "실전 감각을 끌어올리는 고난도 모의고사" }
        ],
        "recommendedBooks": [
          { "name": "쎈 수학", "reason": "필수 유형 학습 교재" },
          { "name": "자이스토리", "reason": "기출문제 분석용 교재" }
        ]
      },
      {
        "site": "메가스터디",
        "instructor": "장미리",
        "mainFeature": "꼼꼼하고 친절한 설명으로 기초를 탄탄히 잡아주는 강좌",
        "lectures": [
          { "title": "장미리 기초 탄탄 개념", "level": "입문", "description": "수포자도 쉽게 이해할 수 있는 기초 개념 강좌" },
          { "title": "장미리 유형 집중 공략", "level": "기본/유형", "description": "학교 시험 및 수능 필수 유형 마스터" },
          { "title": "장미리 시험 직결 특강", "level": "내신/시험", "description": "핵심 요약 및 적중 특강" }
        ],
        "recommendedBooks": [
          { "name": "개념원리", "reason": "기초 개념 학습에 최적화된 교재" },
          { "name": "수학의 바이블", "reason": "자세한 설명이 담긴 참고서" }
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
