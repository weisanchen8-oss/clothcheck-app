function ensureSuccess(res, defaultMessage) {
  if (!res || !res.result || !res.result.success) {
    throw new Error(
      (res && res.result && (res.result.errorMessage || res.result.message)) ||
        defaultMessage
    )
  }

  return res.result.data || res.result
}

function getCurrentUserId() {
  return wx.getStorageSync('userId') || ''
}

function getCurrentWardrobeId() {
  return wx.getStorageSync('currentWardrobeId') || wx.getStorageSync('wardrobeId') || ''
}

function getFileExt(filePath) {
  const matched = filePath.match(/\.[^.]+$/)
  return matched ? matched[0] : '.jpg'
}

async function uploadClothingImage(tempFilePath) {
  if (!tempFilePath) {
    throw new Error('请选择衣物图片')
  }

  const ext = getFileExt(tempFilePath)
  const cloudPath = `clothes/${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`

  const res = await wx.cloud.uploadFile({
    cloudPath,
    filePath: tempFilePath
  })

  if (!res || !res.fileID) {
    throw new Error('图片上传失败')
  }

  return {
    fileID: res.fileID,
    cloudPath
  }
}

async function addClothing(payload) {
  let userId = ''
  let wardrobeId = ''
  let clothing = null

  // 兼容写法1：addClothing(clothingData)
  if (payload && payload.name) {
    userId = payload.userId || getCurrentUserId()
    wardrobeId = payload.wardrobeId || getCurrentWardrobeId()
    clothing = payload
  }

  // 兼容写法2：addClothing({ userId, wardrobeId, clothing })
  if (payload && payload.clothing) {
    userId = payload.userId || payload.clothing.userId || getCurrentUserId()
    wardrobeId = payload.wardrobeId || payload.clothing.wardrobeId || getCurrentWardrobeId()
    clothing = payload.clothing
  }

  if (!userId) {
    throw new Error('缺少 userId，请先完成登录')
  }

  if (!wardrobeId) {
    throw new Error('缺少 wardrobeId，请先选择衣柜')
  }

  if (!clothing) {
    throw new Error('缺少衣物信息')
  }

  const res = await wx.cloud.callFunction({
    name: 'addClothing',
    data: {
      userId,
      wardrobeId,
      clothing
    }
  })

  return ensureSuccess(res, '保存衣物失败')
}

async function listClothes(params = {}) {
  const userId = params.userId || getCurrentUserId()
  const wardrobeId = params.wardrobeId || getCurrentWardrobeId()
  const category = params.category || 'all'

  if (!userId) {
    throw new Error('本地缺少 userId')
  }

  if (!wardrobeId) {
    throw new Error('本地缺少 wardrobeId')
  }

  const res = await wx.cloud.callFunction({
    name: 'listClothes',
    data: {
      userId,
      wardrobeId,
      category
    }
  })

  return ensureSuccess(res, '读取衣物失败')
}

async function getClothesByWardrobe(wardrobeId) {
  return await listClothes({
    wardrobeId,
    category: 'all'
  })
}

module.exports = {
  uploadClothingImage,
  addClothing,
  listClothes,
  getClothesByWardrobe,
  getCurrentUserId,
  getCurrentWardrobeId
}