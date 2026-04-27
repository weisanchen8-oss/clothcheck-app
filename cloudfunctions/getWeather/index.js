const cloud = require("wx-server-sdk");
const https = require("https");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

function getFallbackWeather(reason) {
  return {
    success: true,
    data: {
      cityName: "默认天气",
      latitude: null,
      longitude: null,
      temperature: 20,
      tempMin: 16,
      tempMax: 24,
      weatherText: "天气获取失败",
      weatherCode: -1,
      humidity: 0,
      windLevel: "-",
      source: "fallback",
      fallbackReason: reason || "天气接口请求失败",
      updatedAt: new Date().toISOString()
    },
    errorMessage: ""
  };
}

function getWeatherText(code) {
  const map = {
    0: "晴",
    1: "基本晴朗",
    2: "局部多云",
    3: "阴",
    45: "雾",
    48: "雾凇",
    61: "小雨",
    63: "中雨",
    65: "大雨",
    71: "小雪",
    73: "中雪",
    75: "大雪",
    80: "阵雨",
    81: "中等阵雨",
    82: "强阵雨",
    95: "雷暴"
  };

  return map[code] || "未知天气";
}

function httpsGetJson(url, timeoutMs = 1800) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let rawData = "";

      res.on("data", (chunk) => {
        rawData += chunk;
      });

      res.on("end", () => {
        try {
          resolve(JSON.parse(rawData));
        } catch (err) {
          reject(new Error("天气接口返回内容不是合法 JSON"));
        }
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error("天气接口请求超时"));
    });

    req.on("error", reject);
  });
}

exports.main = async (event) => {
  const latitude = Number(event.latitude);
  const longitude = Number(event.longitude);
  const cityName = event.cityName || "当前位置";

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return getFallbackWeather("缺少有效定位信息");
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return getFallbackWeather("定位信息超出合法范围");
  }

  try {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${latitude}` +
      `&longitude=${longitude}` +
      "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m" +
      "&daily=temperature_2m_max,temperature_2m_min" +
      "&timezone=auto";

    const result = await httpsGetJson(url, 1800);

    if (!result || !result.current || !result.daily) {
      return getFallbackWeather("天气接口返回数据不完整");
    }

    return {
      success: true,
      data: {
        cityName,
        latitude,
        longitude,
        temperature: Math.round(result.current.temperature_2m),
        tempMin: Math.round(result.daily.temperature_2m_min[0]),
        tempMax: Math.round(result.daily.temperature_2m_max[0]),
        weatherText: getWeatherText(result.current.weather_code),
        weatherCode: result.current.weather_code,
        humidity: result.current.relative_humidity_2m || 0,
        windLevel: `${Math.round(result.current.wind_speed_10m || 0)} km/h`,
        source: "open-meteo",
        updatedAt: new Date().toISOString()
      },
      errorMessage: ""
    };
  } catch (err) {
    return getFallbackWeather(err.message);
  }
};