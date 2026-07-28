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

  const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-flash"];
  let lastError = null;

  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `
    22개정 교육과정에 맞춰 학생들이 "${subject}" 과목의 인강을 찾고 있습니다.
    메가스터디, 대성마이맥, EBS, 시대인재 등의 주요 사이트에 개설될 법한 해당 과목의 대표적인 인강 정보 3~4개를 추천해 주세요.
    각 인강마다 아래 필드를 반드시 포함하는 JSON 배열 형식으로만 응답해 주세요. 다른 설명이나 마크다운 서식(```json 등)은 절대 포함하지 마세요.
    
    [
      {
        "site": "메가스터디",
        "instructor": "강사명",
        "title": "강의 제목",
        "feature": "강의 특징 요약 (카드에 표시될 짧은 문구)",
        "description": "강의에 대한 상세한 설명 및 커리큘럼 안내",
        "recommendedBook": "함께 풀면 좋은 추천 시중교재 이름 및 활용 팁",
        "link": "https://www.megastudy.net"
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
    error: '모든 Gemini 모델 호출에 실패했습니다. 상세 오류: ' + (lastError ? lastError.message : '알 수 없는 오류') 
  });
};
