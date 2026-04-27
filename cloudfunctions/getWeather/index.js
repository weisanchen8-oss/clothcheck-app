const cloud = require("wx-server-sdk");
const https = require("https");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

function isValidNumber(value) {
  return typeof value === "number" && !Number.isNaN(value);
}

function getWeatherText(code) {
  const map = {
    0: "晴",
    1: "基本晴朗",
    2: "局部多云",
    3: "阴",
    45: "雾",
    48: "雾凇",
    51: "小毛毛雨",
    53: "中等毛毛雨",
    55: "大毛毛雨",
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

function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let rawData = "";

        res.on("data", (chunk) => {
          rawData += chunk;
        });

        res.on("end", () => {
          try {
            const json = JSON.parse(rawData);
            resolve(json);
          } catch (err) {
            reject(new Error("天气接口返回内容不是合法 JSON"));
          }
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

exports.main = async (event) => {
  try {
    const latitude = Number(event.latitude);
    const longitude = Number(event.longitude);
    const cityName = event.cityName || "当前位置";

    if (!isValidNumber(latitude) || !isValidNumber(longitude)) {
      return {
        success: false,
        errorMessage: "缺少有效的 latitude 或 longitude"
      };
    }

    if (latitude < -90 || latitude > 90) {
      return {
        success: false,
        errorMessage: "latitude 超出合法范围"
      };
    }

    if (longitude < -180 || longitude > 180) {
      return {
        success: false,
        errorMessage: "longitude 超出合法范围"
      };
    }

    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${latitude}` +
      `&longitude=${longitude}` +
      "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m" +
      "&daily=temperature_2m_max,temperature_2m_min" +
      "&timezone=auto";

    const result = await httpsGetJson(url);

    if (!result || !result.current || !result.daily) {
      return {
        success: false,
        errorMessage: "天气接口返回数据不完整"
      };
    }

    const temperature = Math.round(result.current.temperature_2m);
    const tempMin = Math.round(result.daily.temperature_2m_min[0]);
    const tempMax = Math.round(result.daily.temperature_2m_max[0]);
    const humidity = result.current.relative_humidity_2m || 0;
    const windSpeed = result.current.wind_speed_10m || 0;
    const weatherCode = result.current.weather_code;

    return {
      success: true,
      data: {
        cityName,
        latitude,
        longitude,
        temperature,
        tempMin,
        tempMax,
        weatherText: getWeatherText(weatherCode),
        weatherCode,
        humidity,
        windLevel: `${Math.round(windSpeed)} km/h`,
        source: "open-meteo",
        updatedAt: new Date().toISOString()
      },
      errorMessage: ""
    };
  } catch (err) {
    return {
      success: false,
      errorMessage: err.message || "获取天气失败"
    };
  }
};