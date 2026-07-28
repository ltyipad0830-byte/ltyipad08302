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
    
    [핵심 요구사항 1: 대규모 복수 강사진 전원 포함]
    - 메가스터디의 경우 언급하신 이승효, 장영진, 현우진, 장미리 강사를 포함하여 해당 과목을 강의하는 모든 주요 강사진을 빠짐없이 각각 독립된 객체로 생성해 주세요.
    - 대성마이맥, EBS 등 다른 주요 사이트의 강사진들도 빠짐없이 각각 포함해 주세요.

    [핵심 요구사항 2: 강사별로 수많은 인강 리스트 제공 (최소 5~8개 이상)]
    - 각 강사마다 입문, 기본, 응용, 실전, 고난도 심화, 파이널 등 난이도별로 매우 다양한 인강 목록을 풍부하게 작성해 주세요. 

    [핵심 요구사항 3: 각 강의별 'targetStudent' (적합한 학생 유형) 상세 명시]
    - 각 인강 객체마다 반드시 'targetStudent' 필드를 추가하여, 이 강의가 어떤 학생에게 가장 적합한지(예: "수학 개념을 처음 접하며 기초를 탄탄히 다지고 싶은 학생", "고난도 킬러 문항에서 자꾸 막혀 1등급으로 도약하고 싶은 최상위권 학생" 등) 구체적으로 작성해 주세요.

    [핵심 요구사항 4: 시중 교재 다수 추천 및 링크/후기 전면 제거]
    - 쎈, 블랙라벨, 개념원리 등 대표적인 시중 교재들을 여러 개 추천해 주시고, 외부 바로가기 링크나 후기는 절대 만들지 마세요.

    반드시 아래의 JSON 배열 형식으로만 반환해 주세요. 다른 설명이나 마크다운 서식은 절대 포함하지 마세요.
    
    [
      {
        "site": "메가스터디",
        "instructor": "현우진",
        "mainFeature": "수학 1타 강사, 개념부터 고난도 킬러 문항까지 완벽 마스터하는 방대한 커리큘럼",
        "lectures": [
          { 
            "title": "시발점", 
            "level": "입문/개념", 
            "description": "수학의 기초 개념을 아주 세밀하고 탄탄하게 다지는 필수 입문 강좌로, 교과서의 원리를 완벽하게 이해시키는 데 중점을 둡니다.", 
            "targetStudent": "수학 개념을 처음 배우거나, 진도를 나갔지만 기초가 흔들려 개념을 다시 단단히 다지고 싶은 학생" 
          },
          { 
            "title": "수학의 원리", 
            "level": "기본", 
            "description": "교과서 중심의 필수 예제와 유제를 풀어보며 기본기를 탄탄하게 쌓는 강좌입니다.", 
            "targetStudent": "기초 개념 학습 후 다양한 기본 유형 문제를 직접 적용하며 연습하고 싶은 학생" 
          },
          { 
            "title": "뉴맵 (New M)", 
            "level": "실전/심화", 
            "description": "수능적 사고력과 실전 문제 해결 능력을 기르는 대표 강좌로, 복잡한 문제를 직관적이고 논리적으로 해결하는 법을 배웁니다.", 
            "targetStudent": "기본 개념은 끝났으나 준킬러 문항에서 시간이 오래 걸리거나 실전 적용력이 부족한 학생" 
          },
          { 
            "title": "킬링캠프", 
            "level": "고난도/모의고사", 
            "description": "최상위권 도약을 위한 고난도 실전 모의고사 강좌로 수능 최고 난도 문항을 돌파하는 훈련을 합니다.", 
            "targetStudent": "이미 상위권 성적을 달성했으며 수능 1등급 및 만점을 목표로 고난도 킬러 문항을 정복하려는 학생" 
          },
          { 
            "title": "내신 및 수행평가 대비 특강", 
            "level": "내신", 
            "description": "학교 시험 서술형 및 빈출 유형을 완벽하게 대비하는 내신 전용 집중 강좌입니다.", 
            "targetStudent": "학교 내신 시험에서 고득점을 받고 서술형 감점을 줄이고 싶은 고등학생" 
          }
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
          { 
            "title": "이승효 개념 완성", 
            "level": "기본/개념", 
            "description": "교과 개념을 완벽하게 이해하고 응용력을 기르는 강좌입니다.", 
            "targetStudent": "논리적인 설명과 함께 개념의 뼈대를 튼튼하게 세우고 싶은 학생" 
          },
          { 
            "title": "이승효 유형 정복", 
            "level": "응용/유형", 
            "description": "핵심 기출 유형을 마스터하고 문제 풀이 속도를 높이는 실전 강좌입니다.", 
            "targetStudent": "배운 개념을 실제 시험 문제에 빠르게 적용하는 스킬을 배우고 싶은 학생" 
          },
          { 
            "title": "이승효 고난도 심화", 
            "level": "고난도", 
            "description": "준킬러 및 킬러 문항 돌파를 위한 심화 논리를 다루는 강좌입니다.", 
            "targetStudent": "심화 문제에서 막히는 원인을 분석하고 고난도 사고력을 키우고 싶은 학생" 
          },
          { 
            "title": "이승효 파이널 모의고사", 
            "level": "실전/파이널", 
            "description": "수능 및 평가원 완벽 대비 파이널 실전 감각 강화 강좌입니다.", 
            "targetStudent": "실전 시험 시간 배분을 연습하고 최종 실력을 점검하고 싶은 수험생" 
          }
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
          { 
            "title": "장영진 개념의 시작", 
            "level": "입문/개념", 
            "description": "명확하고 간결한 개념 정리를 통해 수학의 틀을 잡아주는 강좌입니다.", 
            "targetStudent": "복잡한 설명보다 깔끔하고 직관적인 개념 정리를 선호하는 학생" 
          },
          { 
            "title": "장영진 문제해결 전략", 
            "level": "실전", 
            "description": "실전 문제 적용 능력을 극대화하는 문제 풀이 전략 강좌입니다.", 
            "targetStudent": "문제를 보고 어떤 개념을 써야 할지 접근법을 쉽게 떠올리지 못하는 학생" 
          },
          { 
            "title": "장영진 실전 모의고사", 
            "level": "파이널", 
            "description": "실전 감각을 최고조로 끌어올리는 고난도 모의고사 훈련 강좌입니다.", 
            "targetStudent": "실전에서 실수 칠 요인을 줄이고 안정적인 상위권 점수를 확보하려는 학생" 
          }
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
          { 
            "title": "장미리 기초 탄탄 개념", 
            "level": "입문", 
            "description": "수포자도 쉽게 이해할 수 있도록 아주 자세하고 친절하게 풀어주는 기초 개념 강좌입니다.", 
            "targetStudent": "수학에 대한 자신감이 부족하거나 기초가 매우 부족해 친절한 설명이 필요한 학생" 
          },
          { 
            "title": "장미리 유형 집중 공략", 
            "level": "기본/유형", 
            "description": "학교 시험 및 수능 필수 유형을 꼼꼼하게 마스터하는 강좌입니다.", 
            "targetStudent": "기초 개념을 배운 후 교과서 수준 및 기본 유형 문제를 확실히 내 것으로 만들고 싶은 학생" 
          },
          { 
            "title": "장미리 시험 직결 특강", 
            "level": "내신/시험", 
            "description": "핵심 요약 및 학교 시험 출제율 높은 문제들을 집중 적중하는 특강입니다.", 
            "targetStudent": "시험 직전 핵심 내용을 빠르게 정리하고 내신 성적을 끌어올리고 싶은 학생" 
          }
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
