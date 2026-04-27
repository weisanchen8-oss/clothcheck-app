const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID

    if (!openid) {
      return {
        success: false,
        errorMessage: '无法获取 openid'
      }
    }

    const now = db.serverDate()

    const userQuery = await db.collection('users').where({
      openid
    }).limit(1).get()

    let user

    if (userQuery.data && userQuery.data.length > 0) {
      user = userQuery.data[0]
    } else {
      const userAddResult = await db.collection('users').add({
        data: {
          openid,
          nickname: '',
          avatar: '',
          createdAt: now,
          updatedAt: now
        }
      })

      user = {
        _id: userAddResult._id,
        openid,
        nickname: '',
        avatar: ''
      }
    }

    const wardrobeQuery = await db.collection('wardrobes').where({
      userId: user._id,
      isDefault: true
    }).limit(1).get()

    let wardrobe

    if (wardrobeQuery.data && wardrobeQuery.data.length > 0) {
      wardrobe = wardrobeQuery.data[0]
    } else {
      const wardrobeAddResult = await db.collection('wardrobes').add({
        data: {
          userId: user._id,
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

      wardrobe = {
        _id: wardrobeAddResult._id,
        userId: user._id,
        name: '我的衣柜',
        type: 'human',
        ownerName: '我',
        ownerRole: 'self',
        isDefault: true
      }
    }

    return {
      success: true,
      data: {
        openid,
        userId: user._id,
        wardrobeId: wardrobe._id,
        user,
        wardrobe
      },
      errorMessage: ''
    }
  } catch (error) {
    console.error('[initUser error]', error)

    return {
      success: false,
      data: null,
      errorMessage: error.message || '用户初始化失败'
    }
  }
}