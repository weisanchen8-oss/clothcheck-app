const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

const VALID_CATEGORIES = [
  'all',
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

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()

    const {
      userId,
      wardrobeId,
      category = 'all'
    } = event || {}

    if (!userId || typeof userId !== 'string') {
      return {
        success: false,
        errorMessage: '缺少有效的 userId'
      }
    }

    if (!wardrobeId || typeof wardrobeId !== 'string') {
      return {
        success: false,
        errorMessage: '缺少有效的 wardrobeId'
      }
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return {
        success: false,
        errorMessage: '分类参数不合法'
      }
    }

    const query = {
      userId,
      wardrobeId,
      status: 'active'
    }

    if (category !== 'all') {
      query.category = category
    }

    const result = await db
      .collection('clothes')
      .where(query)
      .orderBy('createdAt', 'desc')
      .get()

    return {
      success: true,
      data: result.data || [],
      count: result.data ? result.data.length : 0,
      openid: wxContext.OPENID,
      errorMessage: ''
    }
  } catch (error) {
    console.error('[listClothes error]', error)

    return {
      success: false,
      data: [],
      count: 0,
      errorMessage: error.message || '读取衣物列表失败'
    }
  }
}