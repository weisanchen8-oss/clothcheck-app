function getLocation() {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: "wgs84",
      success: resolve,
      fail: reject
    });
  });
}

async function getCurrentWeather() {
  try {
    const location = await getLocation();

    const res = await wx.cloud.callFunction({
      name: "getWeather",
      data: {
        latitude: location.latitude,
        longitude: location.longitude,
        cityName: "当前位置"
      }
    });

    const result = res.result;

    if (!result || !result.success) {
      throw new Error(result?.errorMessage || "天气云函数返回失败");
    }

    return result.data;
  } catch (err) {
    console.error("[weatherService] 获取天气失败：", err);

    return {
      cityName: "默认天气",
      temperature: 20,
      tempMin: 16,
      tempMax: 24,
      weatherText: "天气获取失败",
      windLevel: "-",
      humidity: 0,
      source: "fallback",
      updatedAt: new Date().toISOString()
    };
  }
}

module.exports = {
  getCurrentWeather
};