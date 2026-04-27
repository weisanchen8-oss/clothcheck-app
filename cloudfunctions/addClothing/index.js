const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

const CATEGORY_VALUES = [
  'top',
  'bottom',
  'outerwear',
  'dress',
  'shoes',
  'bag',
  'accessory',
  'underwear',
  'pet',
  'other'
]

const THICKNESS_VALUES = ['thin', 'medium', 'thick', 'extra']
const SOURCE_TYPE_VALUES = ['manual', 'image', 'link', 'screenshot']
const STATUS_VALUES = ['active', 'idle', 'discard_candidate', 'discarded']
const SEASON_VALUES = ['spring', 'summer', 'autumn', 'winter']

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidNumber(value) {
  return typeof value === 'number' && !Number.isNaN(value)
}

function validateStringArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} 必须是数组`)
  }

  value.forEach(item => {
    if (typeof item !== 'string') {
      throw new Error(`${fieldName} 中只能包含字符串`)
    }
  })
}

function validateClothing(event) {
  const { userId, wardrobeId, clothing } = event

  if (!isNonEmptyString(userId)) {
    throw new Error('缺少 userId')
  }

  if (!isNonEmptyString(wardrobeId)) {
    throw new Error('缺少 wardrobeId')
  }

  if (!clothing || typeof clothing !== 'object') {
    throw new Error('缺少 clothing 对象')
  }

  if (!isNonEmptyString(clothing.name)) {
    throw new Error('衣物名称不能为空')
  }

  if (!isNonEmptyString(clothing.imageUrl)) {
    throw new Error('衣物图片不能为空')
  }

  if (!CATEGORY_VALUES.includes(clothing.category)) {
    throw new Error('衣物分类不合法')
  }

  if (!isNonEmptyString(clothing.subCategory)) {
    throw new Error('子分类不能为空')
  }

  if (!isNonEmptyString(clothing.color)) {
    throw new Error('颜色代码不能为空')
  }

  if (!isNonEmptyString(clothing.colorName)) {
    throw new Error('颜色名称不能为空')
  }

  if (!THICKNESS_VALUES.includes(clothing.thickness)) {
    throw new Error('厚度不合法')
  }

  if (!isValidNumber(clothing.warmLevel) || clothing.warmLevel < 1 || clothing.warmLevel > 6) {
    throw new Error('保暖等级必须是 1-6')
  }

  validateStringArray(clothing.season, 'season')
  validateStringArray(clothing.styleTags, 'styleTags')
  validateStringArray(clothing.sceneTags, 'sceneTags')

  if (clothing.season.length === 0) {
    throw new Error('season 至少选择一个季节')
  }

  const invalidSeason = clothing.season.find(item => !SEASON_VALUES.includes(item))
  if (invalidSeason) {
    throw new Error('season 中存在不合法季节')
  }

  if (!isValidNumber(clothing.temperatureMin)) {
    throw new Error('最低温度必须是数字')
  }

  if (!isValidNumber(clothing.temperatureMax)) {
    throw new Error('最高温度必须是数字')
  }

  if (clothing.temperatureMin > clothing.temperatureMax) {
    throw new Error('最低温度不能高于最高温度')
  }

  if (clothing.sourceType && !SOURCE_TYPE_VALUES.includes(clothing.sourceType)) {
    throw new Error('来源类型不合法')
  }

  if (typeof clothing.aiRecognized !== 'boolean') {
    throw new Error('aiRecognized 必须是布尔值')
  }

  if (typeof clothing.aiConfidence !== 'number' || Number.isNaN(clothing.aiConfidence)) {
    throw new Error('aiConfidence 必须是数字')
  }

  if (typeof clothing.userConfirmed !== 'boolean' || clothing.userConfirmed !== true) {
    throw new Error('必须由用户确认后才能保存')
  }
}

exports.main = async (event) => {
  try {
    validateClothing(event)

    const { userId, wardrobeId, clothing } = event
    const now = db.serverDate()

    const data = {
      userId,
      wardrobeId,

      name: clothing.name.trim(),
      imageUrl: clothing.imageUrl,

      category: clothing.category,
      subCategory: clothing.subCategory.trim(),

      color: clothing.color.trim(),
      colorName: clothing.colorName.trim(),

      thickness: clothing.thickness,
      warmLevel: clothing.warmLevel,

      season: clothing.season,
      styleTags: clothing.styleTags,
      sceneTags: clothing.sceneTags,

      temperatureMin: clothing.temperatureMin,
      temperatureMax: clothing.temperatureMax,

      material: clothing.material || '',
      fit: clothing.fit || '',

      sourceType: clothing.sourceType || 'image',
      sourceLink: clothing.sourceLink || '',

      aiRecognized: clothing.aiRecognized,
      aiConfidence: clothing.aiConfidence,
      userConfirmed: true,

      wearCount: 0,
      lastWornAt: null,

      status: STATUS_VALUES.includes(clothing.status) ? clothing.status : 'active',

      createdAt: now,
      updatedAt: now
    }

    const addRes = await db.collection('clothes').add({
      data
    })

    return {
      success: true,
      message: '衣物保存成功',
      data: {
        _id: addRes._id
      }
    }
  } catch (err) {
    return {
      success: false,
      message: err.message || '衣物保存失败',
      data: null
    }
  }
}