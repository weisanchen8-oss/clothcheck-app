const CURRENT_WARDROBE_ID_KEY = 'currentWardrobeId'
const CURRENT_WARDROBE_KEY = 'currentWardrobe'

function getUserId() {
  return wx.getStorageSync('userId') || ''
}

function getCurrentWardrobeId() {
  return wx.getStorageSync(CURRENT_WARDROBE_ID_KEY) || ''
}

function getCurrentWardrobe() {
  return wx.getStorageSync(CURRENT_WARDROBE_KEY) || null
}

function setCurrentWardrobe(wardrobe) {
  if (!wardrobe || !wardrobe._id) {
    return
  }

  wx.setStorageSync(CURRENT_WARDROBE_ID_KEY, wardrobe._id)
  wx.setStorageSync(CURRENT_WARDROBE_KEY, wardrobe)
}

async function callManageWardrobes(data) {
  const res = await wx.cloud.callFunction({
    name: 'manageWardrobes',
    data
  })

  const result = res.result

  if (!result || !result.success) {
    throw new Error(result && result.errorMessage ? result.errorMessage : '衣柜操作失败')
  }

  return result.data
}

async function getWardrobes() {
  const userId = getUserId()

  if (!userId) {
    throw new Error('本地缓存中没有 userId，请先完成用户初始化')
  }

  const data = await callManageWardrobes({
    action: 'list',
    userId
  })

  const wardrobes = data.wardrobes || []
  const cachedWardrobeId = getCurrentWardrobeId()

  let current = wardrobes.find(item => item._id === cachedWardrobeId)

  if (!current) {
    current = wardrobes.find(item => item.isDefault) || wardrobes[0]
  }

  if (current) {
    setCurrentWardrobe(current)
  }

  return {
    wardrobes,
    currentWardrobe: current || null
  }
}

async function createWardrobe(form) {
  const userId = getUserId()

  if (!userId) {
    throw new Error('本地缓存中没有 userId，请先完成用户初始化')
  }

  const data = await callManageWardrobes({
    action: 'create',
    userId,
    name: form.name,
    type: form.type,
    ownerName: form.ownerName,
    ownerRole: form.ownerRole,
    gender: form.gender,
    ageGroup: form.ageGroup,
    avatar: form.avatar || ''
  })

  return data.wardrobe
}

async function switchWardrobe(wardrobeId) {
  const userId = getUserId()

  if (!userId) {
    throw new Error('本地缓存中没有 userId，请先完成用户初始化')
  }

  if (!wardrobeId) {
    throw new Error('缺少 wardrobeId')
  }

  const data = await callManageWardrobes({
    action: 'switch',
    userId,
    wardrobeId
  })

  setCurrentWardrobe(data.wardrobe)

  return data.wardrobe
}

async function setDefaultWardrobe(wardrobeId) {
  const userId = getUserId()

  if (!userId) {
    throw new Error('本地缓存中没有 userId，请先完成用户初始化')
  }

  const data = await callManageWardrobes({
    action: 'setDefault',
    userId,
    wardrobeId
  })

  setCurrentWardrobe(data.wardrobe)

  return data.wardrobe
}

async function updateWardrobe(wardrobeId, form) {
  const userId = getUserId()

  if (!userId) {
    throw new Error('本地缓存中没有 userId，请先完成用户初始化')
  }

  const data = await callManageWardrobes({
    action: 'update',
    userId,
    wardrobeId,
    ...form
  })

  const currentWardrobeId = getCurrentWardrobeId()

  if (currentWardrobeId === wardrobeId) {
    setCurrentWardrobe(data.wardrobe)
  }

  return data.wardrobe
}

async function deleteWardrobe(wardrobeId) {
  const userId = getUserId()

  if (!userId) {
    throw new Error('本地缓存中没有 userId，请先完成用户初始化')
  }

  await callManageWardrobes({
    action: 'delete',
    userId,
    wardrobeId
  })

  const currentWardrobeId = getCurrentWardrobeId()

  if (currentWardrobeId === wardrobeId) {
    wx.removeStorageSync(CURRENT_WARDROBE_ID_KEY)
    wx.removeStorageSync(CURRENT_WARDROBE_KEY)
  }
}

module.exports = {
  getUserId,
  getCurrentWardrobeId,
  getCurrentWardrobe,
  setCurrentWardrobe,
  getWardrobes,
  createWardrobe,
  switchWardrobe,
  setDefaultWardrobe,
  updateWardrobe,
  deleteWardrobe
}