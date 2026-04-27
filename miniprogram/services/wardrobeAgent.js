const weatherTool = require("./weatherTool.js");
const closetQueryTool = require("./closetQueryTool.js");
const agentLogService = require("./agentLogService.js");

function isActiveClothing(item) {
  return !item.status || item.status === "active";
}

function matchTemperature(item, temperature) {
  const min = Number(item.temperatureMin);
  const max = Number(item.temperatureMax);

  if (Number.isNaN(min) || Number.isNaN(max)) {
    return true;
  }

  return temperature >= min - 2 && temperature <= max + 2;
}

function pickFirstByCategory(clothes, category) {
  return clothes.find((item) => item.category === category);
}

function buildOutfits(clothes, weather) {
  const temperature = Number(weather.temperature);

  const matched = clothes.filter((item) => {
    return isActiveClothing(item) && matchTemperature(item, temperature);
  });

  const top = pickFirstByCategory(matched, "top");
  const bottom = pickFirstByCategory(matched, "bottom");
  const outerwear = pickFirstByCategory(matched, "outerwear");
  const shoes = pickFirstByCategory(matched, "shoes");

  const clothingIds = [];

  if (top) clothingIds.push(top._id);
  if (bottom) clothingIds.push(bottom._id);

  if (temperature <= 18 && outerwear) {
    clothingIds.push(outerwear._id);
  }

  if (shoes) clothingIds.push(shoes._id);

  if (clothingIds.length === 0) {
    return [];
  }

  const items = matched.filter((item) => clothingIds.includes(item._id));

  return [
    {
      title: "今日 Agent 推荐",
      clothingIds,
      items,
      reason: `当前真实气温约 ${weather.temperature}℃，Agent 已结合衣柜中适合该温度范围的衣物生成推荐。`,
      weatherSnapshot: weather,
      confidence: 0.78
    }
  ];
}

function buildFallbackSuggestions(clothes, weather) {
  const temperature = Number(weather.temperature);
  const suggestions = [];

  const hasTop = clothes.some((item) => item.category === "top");
  const hasBottom = clothes.some((item) => item.category === "bottom");
  const hasOuterwear = clothes.some((item) => item.category === "outerwear");

  if (!hasTop) {
    suggestions.push({
      missingCategory: "top",
      suggestion: "当前衣柜缺少上衣，建议先录入衬衫、T恤、卫衣等基础上衣。"
    });
  }

  if (!hasBottom) {
    suggestions.push({
      missingCategory: "bottom",
      suggestion: "当前衣柜缺少下装，建议录入长裤、半裙或短裤。"
    });
  }

  if (temperature <= 18 && !hasOuterwear) {
    suggestions.push({
      missingCategory: "outerwear",
      suggestion: `当前真实气温约 ${weather.temperature}℃，建议补充外套类衣物。`
    });
  }

  return suggestions;
}

async function runTodayRecommendation() {
  const toolsUsed = [];
  const decisionSteps = [];

  try {
    decisionSteps.push("识别意图：今日穿搭推荐");

    const weatherResult = await weatherTool.getCurrentWeather();
    toolsUsed.push("weatherTool");
    decisionSteps.push(weatherResult.message);

    const closetResult = await closetQueryTool.getActiveClothesByCurrentWardrobe();
    toolsUsed.push("closetQueryTool");
    decisionSteps.push(closetResult.message);

    if (!closetResult.success) {
      await agentLogService.saveAgentRun({
        intent: "today_outfit_recommendation",
        inputText: "今天穿什么？",
        toolsUsed,
        decisionSteps,
        resultSummary: "当前没有选中的衣柜，请先进入衣橱页选择衣柜。",
        success: false,
        errorMessage: closetResult.message
      });

      return {
        success: false,
        intent: "today_outfit_recommendation",
        answer: "当前没有选中的衣柜，请先进入衣橱页选择衣柜。",
        weather: weatherResult.data,
        outfits: [],
        fallbackSuggestions: [
          {
            missingCategory: "wardrobe",
            suggestion: "当前没有选中的衣柜，请先进入衣橱页选择一个衣柜。"
          }
        ],
        decisionSteps,
        toolsUsed,
        errorMessage: closetResult.message
      };
    }

    const clothes = closetResult.data;
    const weather = weatherResult.data;

    const outfits = buildOutfits(clothes, weather);
    const fallbackSuggestions = buildFallbackSuggestions(clothes, weather);

    decisionSteps.push("筛选衣物：根据真实温度匹配衣物温度范围");
    decisionSteps.push(
      outfits.length > 0
        ? `生成推荐：生成 ${outfits.length} 套穿搭`
        : "生成推荐：当前衣柜暂未匹配到完整搭配"
    );

    const answer =
      outfits.length > 0
        ? `今天约 ${weather.temperature}℃，已为你生成今日穿搭推荐。`
        : `今天约 ${weather.temperature}℃，但当前衣柜缺少完整搭配所需衣物。`;

    await agentLogService.saveAgentRun({
      intent: "today_outfit_recommendation",
      inputText: "今天穿什么？",
      toolsUsed,
      decisionSteps,
      resultSummary: answer,
      success: true,
      errorMessage: ""
    });

    return {
      success: true,
      intent: "today_outfit_recommendation",
      answer,
      weather,
      outfits,
      fallbackSuggestions,
      decisionSteps,
      toolsUsed,
      errorMessage: ""
    };
  } catch (err) {
    console.error("[wardrobeAgent] 今日推荐失败：", err);

    decisionSteps.push("Agent 执行失败");

    await agentLogService.saveAgentRun({
      intent: "today_outfit_recommendation",
      inputText: "今天穿什么？",
      toolsUsed,
      decisionSteps,
      resultSummary: "今日推荐生成失败，请稍后重试。",
      success: false,
      errorMessage: err.message || "Agent 执行失败"
    });

    return {
      success: false,
      intent: "today_outfit_recommendation",
      answer: "今日推荐生成失败，请稍后重试。",
      weather: null,
      outfits: [],
      fallbackSuggestions: [],
      decisionSteps,
      toolsUsed,
      errorMessage: err.message || "Agent 执行失败"
    };
  }
}

module.exports = {
  runTodayRecommendation
};