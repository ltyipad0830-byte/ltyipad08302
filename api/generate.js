const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subject } = req.body;

  if (!subject) {
    return res.status(400).json({ error: '과목명을 입력해주세요.' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      22개정 교육과정에 맞춰 학생들이 "${subject}" 과목의 인강을 찾고 있습니다.
      메가스터디, 대성마이맥, EBS, 시대인재 등의 주요 사이트에 개설될 법한 해당 과목의 대표적인 인강 정보(사이트명, 강사명, 강의명, 특징)를 사이트별로 골고루 3~4개 정도 추천해 주세요.
      반드시 아래의 JSON 배열 형식으로만 반환해 주세요. 다른 설명이나 텍스트는 절대 포함하지 마세요. (마크다운 백틱 ```json 등도 제외)
      
      [
        {
          "site": "메가스터디",
          "instructor": "강사명",
          "title": "강의 제목",
          "feature": "강의 특징 요약"
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    let textResponse = result.response.text().trim();
    textResponse = textResponse.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");

    const data = JSON.parse(textResponse);
    return res.status(200).json({ results: data });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: '서버 내부 오류 발생: ' + error.message });
  }
};
