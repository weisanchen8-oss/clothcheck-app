const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

const VALID_TYPES = ['human', 'pet']
const VALID_OWNER_ROLES = ['self', 'family', 'friend', 'pet', 'other']
const VALID_GENDERS = ['female', 'male', 'neutral', 'unknown']
const VALID_AGE_GROUPS = ['baby', 'child', 'teen', 'adult', 'senior', 'pet', 'unknown']

function success(data = {}) {
  return {
    success: true,
    data,
    errorMessage: ''
  }
}

function fail(errorMessage) {
  return {
    success: false,
    data: null,
    errorMessage
  }
}

function validateUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    return '缺少 userId'
  }
  return ''
}

async function getWardrobeById(wardrobeId, userId) {
  const res = await db.collection('wardrobes')
    .where({
      _id: wardrobeId,
      userId
    })
    .limit(1)
    .get()

  return res.data[0] || null
}

async function listWardrobes(userId) {
  const res = await db.collection('wardrobes')
    .where({ userId })
    .orderBy('sortOrder', 'asc')
    .orderBy('createdAt', 'asc')
    .get()

  return res.data
}

async function createDefaultWardrobeIfNeeded(userId) {
  const existing = await listWardrobes(userId)

  if (existing.length > 0) {
    return existing
  }

  const now = db.serverDate()

  await db.collection('wardrobes').add({
    data: {
      userId,
      name: '我的衣柜',
      type: 'human',
      ownerName: '我',
      ownerRole: 'self',
      avatar: '',
      gender: 'unknown',
      ageGroup: 'adult',
      isDefault: true,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now
    }
  })

  return await listWardrobes(userId)
}

async function setDefaultWardrobe(userId, wardrobeId) {
  const target = await getWardrobeById(wardrobeId, userId)

  if (!target) {
    throw new Error('衣柜不存在或不属于当前用户')
  }

  const all = await listWardrobes(userId)

  await Promise.all(
    all.map(item => {
      return db.collection('wardrobes').doc(item._id).update({
        data: {
          isDefault: item._id === wardrobeId,
          updatedAt: db.serverDate()
        }
      })
    })
  )

  return await getWardrobeById(wardrobeId, userId)
}

exports.main = async (event) => {
  try {
    const {
      action,
      userId,
      wardrobeId,
      name,
      type,
      ownerName,
      ownerRole,
      avatar,
      gender,
      ageGroup
    } = event || {}

    const userError = validateUserId(userId)
    if (userError) return fail(userError)

    if (!action) return fail('缺少 action')

    if (action === 'list') {
      const wardrobes = await createDefaultWardrobeIfNeeded(userId)
      return success({ wardrobes })
    }

    if (action === 'create') {
      if (!name || typeof name !== 'string') {
        return fail('请输入衣柜名称')
      }

      const finalType = type || 'human'
      const finalOwnerRole = ownerRole || 'self'
      const finalGender = gender || 'unknown'
      const finalAgeGroup = ageGroup || (finalType === 'pet' ? 'pet' : 'adult')

      if (!VALID_TYPES.includes(finalType)) return fail('type 不合法')
      if (!VALID_OWNER_ROLES.includes(finalOwnerRole)) return fail('ownerRole 不合法')
      if (!VALID_GENDERS.includes(finalGender)) return fail('gender 不合法')
      if (!VALID_AGE_GROUPS.includes(finalAgeGroup)) return fail('ageGroup 不合法')

      const current = await listWardrobes(userId)
      const isFirst = current.length === 0
      const now = db.serverDate()

      const addRes = await db.collection('wardrobes').add({
        data: {
          userId,
          name: name.trim(),
          type: finalType,
          ownerName: ownerName || name.trim(),
          ownerRole: finalOwnerRole,
          avatar: avatar || '',
          gender: finalGender,
          ageGroup: finalAgeGroup,
          isDefault: isFirst,
          sortOrder: current.length + 1,
          createdAt: now,
          updatedAt: now
        }
      })

      const newWardrobe = await getWardrobeById(addRes._id, userId)

      return success({ wardrobe: newWardrobe })
    }

    if (action === 'switch') {
      if (!wardrobeId) return fail('缺少 wardrobeId')

      const wardrobe = await getWardrobeById(wardrobeId, userId)

      if (!wardrobe) {
        return fail('衣柜不存在或不属于当前用户')
      }

      return success({ wardrobe })
    }

    if (action === 'setDefault') {
      if (!wardrobeId) return fail('缺少 wardrobeId')

      const wardrobe = await setDefaultWardrobe(userId, wardrobeId)

      return success({ wardrobe })
    }

    if (action === 'update') {
      if (!wardrobeId) return fail('缺少 wardrobeId')

      const target = await getWardrobeById(wardrobeId, userId)
      if (!target) return fail('衣柜不存在或不属于当前用户')

      const updateData = {
        updatedAt: db.serverDate()
      }

      if (name !== undefined) {
        if (!name || typeof name !== 'string') return fail('衣柜名称不能为空')
        updateData.name = name.trim()
      }

      if (type !== undefined) {
        if (!VALID_TYPES.includes(type)) return fail('type 不合法')
        updateData.type = type
      }

      if (ownerName !== undefined) updateData.ownerName = ownerName
      if (ownerRole !== undefined) {
        if (!VALID_OWNER_ROLES.includes(ownerRole)) return fail('ownerRole 不合法')
        updateData.ownerRole = ownerRole
      }

      if (avatar !== undefined) updateData.avatar = avatar
      if (gender !== undefined) {
        if (!VALID_GENDERS.includes(gender)) return fail('gender 不合法')
        updateData.gender = gender
      }

      if (ageGroup !== undefined) {
        if (!VALID_AGE_GROUPS.includes(ageGroup)) return fail('ageGroup 不合法')
        updateData.ageGroup = ageGroup
      }

      await db.collection('wardrobes').doc(wardrobeId).update({
        data: updateData
      })

      const wardrobe = await getWardrobeById(wardrobeId, userId)

      return success({ wardrobe })
    }

    if (action === 'delete') {
      if (!wardrobeId) return fail('缺少 wardrobeId')

      const target = await getWardrobeById(wardrobeId, userId)
      if (!target) return fail('衣柜不存在或不属于当前用户')

      const wardrobes = await listWardrobes(userId)

      if (wardrobes.length <= 1) {
        return fail('至少需要保留一个衣柜')
      }

      const clothesCount = await db.collection('clothes')
        .where({
          userId,
          wardrobeId,
          status: _.neq('discarded')
        })
        .count()

      if (clothesCount.total > 0) {
        return fail('该衣柜下还有衣物，暂时不能删除')
      }

      await db.collection('wardrobes').doc(wardrobeId).remove()

      if (target.isDefault) {
        const rest = await listWardrobes(userId)
        if (rest.length > 0) {
          await setDefaultWardrobe(userId, rest[0]._id)
        }
      }

      return success({})
    }

    return fail('未知 action')
  } catch (err) {
    return fail(err.message || 'manageWardrobes 云函数执行失败')
  }
}