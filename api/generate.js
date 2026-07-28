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
    메가스터디, 대성마이맥, EBS, 시대인재 등 주요 사이트 각각에 개설된 해당 과목의 **모든 주요 강사의 대표 인강들을 누락 없이 전부(사이트당 여러 개 가능, 총 6~8개 이상)** 추천해 주세요.
    반드시 아래의 JSON 배열 형식으로만 반환해 주세요. 다른 설명이나 마크다운 서식은 절대 포함하지 마세요.
    
    [
      {
        "site": "메가스터디",
        "instructor": "강사명",
        "title": "강의 제목",
        "feature": "핵심 특징 요약 (카드에 표시될 짧은 텍스트)",
        "description": "해당 강의에 대한 상세한 설명과 커리큘럼 안내",
        "lectureLink": "https://www.megastudy.net",
        "reviewLink": "https://www.megastudy.net",
        "recommendedBooks": [
          {
            "name": "교재 이름 1",
            "reason": "교재 연계 학습법 및 추천 이유",
            "imageUrl": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200"
          },
          {
            "name": "교재 이름 2",
            "reason": "교재 연계 학습법 및 추천 이유",
            "imageUrl": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200"
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
