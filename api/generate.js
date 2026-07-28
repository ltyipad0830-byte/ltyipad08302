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
