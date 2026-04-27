const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event) => {
  try {
    const { imageUrl, sourceType = 'image' } = event

    if (!imageUrl) {
      return {
        success: false,
        message: '缺少 imageUrl',
        data: null
      }
    }

    const mockResult = {
      name: '白色长袖衬衫',
      category: 'top',
      subCategory: 'shirt',

      color: 'white',
      colorName: '白色',

      thickness: 'thin',
      warmLevel: 2,

      season: ['spring', 'summer', 'autumn'],
      styleTags: ['minimal', 'commute'],
      sceneTags: ['work', 'daily'],

      temperatureMin: 18,
      temperatureMax: 28,

      material: 'cotton',
      fit: 'regular',

      aiConfidence: 0.82,
      needUserConfirm: true,

      sourceType
    }

    return {
      success: true,
      message: 'AI mock 识别成功',
      data: mockResult
    }
  } catch (err) {
    return {
      success: false,
      message: err.message || 'AI mock 识别失败',
      data: null
    }
  }
}