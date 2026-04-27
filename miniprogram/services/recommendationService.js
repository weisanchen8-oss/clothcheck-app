const weatherService = require("./weatherService.js");

const db = wx.cloud.database();

function getCurrentWardrobeId() {
  return wx.getStorageSync("currentWardrobeId") || "";
}

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
      title: "今日智能推荐",
      clothingIds,
      items,
      reason: `当前真实气温约 ${weather.temperature}℃，系统优先选择适合该温度范围的衣物。`,
      weatherSnapshot: weather,
      confidence: 0.76
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

async function getTodayRecommendation() {
  const wardrobeId = getCurrentWardrobeId();

  if (!wardrobeId) {
    return {
      success: false,
      weather: null,
      outfits: [],
      fallbackSuggestions: [
        {
          missingCategory: "wardrobe",
          suggestion: "当前没有选中的衣柜，请先进入衣橱页选择一个衣柜。"
        }
      ],
      errorMessage: "缺少 currentWardrobeId"
    };
  }

  const weather = await weatherService.getCurrentWeather();

  const res = await db
    .collection("clothes")
    .where({
      wardrobeId,
      status: "active"
    })
    .get();

  const clothes = res.data || [];
  const outfits = buildOutfits(clothes, weather);
  const fallbackSuggestions = buildFallbackSuggestions(clothes, weather);

  return {
    success: true,
    weather,
    outfits,
    fallbackSuggestions,
    errorMessage: ""
  };
}

module.exports = {
  getTodayRecommendation
};