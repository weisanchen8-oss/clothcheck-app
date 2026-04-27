const weatherService = require("./weatherService.js");

async function getCurrentWeather() {
  const weather = await weatherService.getCurrentWeather();

  const isFallback = weather.source === "fallback";

  return {
    success: true,
    toolName: "weatherTool",
    data: weather,
    message: isFallback
      ? `读取天气：真实天气获取失败，已使用默认天气 ${weather.temperature}℃`
      : `读取天气：${weather.temperature}℃，${weather.weatherText}`
  };
}

module.exports = {
  getCurrentWeather
};