const clothingService = require('../../services/clothingService')
const wardrobeService = require('../../services/wardrobeService')
const aiService = require('../../services/aiService')

Page({
  data: {
    loading: false,
    recognizing: false,
    saving: false,

    userId: '',
    currentWardrobe: null,
    currentWardrobeId: '',

    imageUrl: '',
    tempImagePath: '',

    form: {
      name: '',
      category: 'top',
      subCategory: '',
      color: '',
      colorName: '',
      thickness: 'medium',
      warmLevel: 3,
      season: ['spring', 'summer'],
      styleTags: ['casual'],
      sceneTags: ['daily'],
      temperatureMin: 15,
      temperatureMax: 28,
      material: '',
      fit: 'regular'
    },

    categories: [
      { label: '上衣', value: 'top' },
      { label: '下装', value: 'bottom' },
      { label: '外套', value: 'outerwear' },
      { label: '裙装', value: 'dress' },
      { label: '鞋', value: 'shoes' },
      { label: '包', value: 'bag' },
      { label: '配饰', value: 'accessory' },
      { label: '其他', value: 'other' }
    ],

    thicknessOptions: [
      { label: '薄', value: 'thin' },
      { label: '中等', value: 'medium' },
      { label: '厚', value: 'thick' },
      { label: '加厚', value: 'extra' }
    ]
  },

  onShow() {
    this.initWardrobe()
  },

  async initWardrobe() {
    try {
      this.setData({ loading: true })

      const userId = wardrobeService.getUserId()
      const result = await wardrobeService.getWardrobes()
      const currentWardrobe = result.currentWardrobe

      if (!userId || !currentWardrobe || !currentWardrobe._id) {
        wx.showModal({
          title: '需要先选择衣柜',
          content: '添加衣物前，请先创建或选择一个衣柜。',
          confirmText: '去选择',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({
                url: '/pages/wardrobes/wardrobes'
              })
            }
          }
        })
        return
      }

      this.setData({
        userId,
        currentWardrobe,
        currentWardrobeId: currentWardrobe._id
      })

      wx.setNavigationBarTitle({
        title: `添加到${currentWardrobe.name}`
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '衣柜加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath

        this.setData({
          tempImagePath: tempFilePath
        })

        this.uploadImage(tempFilePath)
      }
    })
  },

  async uploadImage(tempFilePath) {
    try {
      wx.showLoading({ title: '上传中' })

      const cloudPath = `clothes/${Date.now()}-${Math.floor(Math.random() * 10000)}.jpg`

      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath: tempFilePath
      })

      this.setData({
        imageUrl: uploadRes.fileID
      })

      wx.hideLoading()

      await this.recognizeClothing(uploadRes.fileID)
    } catch (err) {
      wx.hideLoading()
      wx.showToast({
        title: err.message || '图片上传失败',
        icon: 'none'
      })
    }
  },

  async recognizeClothing(imageUrl) {
    try {
      this.setData({ recognizing: true })

      let result = null

      if (aiService && typeof aiService.recognizeClothing === 'function') {
        result = await aiService.recognizeClothing(imageUrl)
      }

      const mockResult = result || {
        name: '待确认衣物',
        category: 'top',
        subCategory: '',
        color: 'white',
        colorName: '白色',
        thickness: 'medium',
        warmLevel: 3,
        season: ['spring', 'summer'],
        styleTags: ['casual'],
        sceneTags: ['daily'],
        temperatureMin: 15,
        temperatureMax: 28,
        material: '',
        fit: 'regular',
        aiConfidence: 0.6
      }

      this.setData({
        form: {
          ...this.data.form,
          ...mockResult
        }
      })

      wx.showToast({
        title: '识别完成，请确认',
        icon: 'none'
      })
    } catch (err) {
      wx.showToast({
        title: err.message || 'AI识别失败',
        icon: 'none'
      })
    } finally {
      this.setData({ recognizing: false })
    }
  },

  onInputName(e) {
    this.setData({
      'form.name': e.detail.value
    })
  },

  onInputSubCategory(e) {
    this.setData({
      'form.subCategory': e.detail.value
    })
  },

  onInputColor(e) {
    this.setData({
      'form.colorName': e.detail.value
    })
  },

  onInputMaterial(e) {
    this.setData({
      'form.material': e.detail.value
    })
  },

  onCategoryTap(e) {
    this.setData({
      'form.category': e.currentTarget.dataset.value
    })
  },

  onThicknessTap(e) {
    const value = e.currentTarget.dataset.value

    const warmMap = {
      thin: 2,
      medium: 3,
      thick: 5,
      extra: 6
    }

    this.setData({
      'form.thickness': value,
      'form.warmLevel': warmMap[value] || 3
    })
  },

  onTempMinInput(e) {
    this.setData({
      'form.temperatureMin': Number(e.detail.value)
    })
  },

  onTempMaxInput(e) {
    this.setData({
      'form.temperatureMax': Number(e.detail.value)
    })
  },

  async saveClothing() {
    const { userId, currentWardrobeId, imageUrl, form } = this.data

    if (!userId) {
      wx.showToast({
        title: '缺少 userId',
        icon: 'none'
      })
      return
    }

    if (!currentWardrobeId) {
      wx.showToast({
        title: '请先选择衣柜',
        icon: 'none'
      })
      return
    }

    if (!imageUrl) {
      wx.showToast({
        title: '请先上传图片',
        icon: 'none'
      })
      return
    }

    if (!form.name || !form.name.trim()) {
      wx.showToast({
        title: '请输入衣物名称',
        icon: 'none'
      })
      return
    }

    try {
      this.setData({ saving: true })
      wx.showLoading({ title: '保存中' })

      const clothingData = {
        userId,
        wardrobeId: currentWardrobeId,

        name: form.name.trim(),
        imageUrl,

        category: form.category,
        subCategory: form.subCategory || '',

        color: form.color || '',
        colorName: form.colorName || form.color || '',

        thickness: form.thickness,
        warmLevel: Number(form.warmLevel) || 3,

        season: form.season || [],
        styleTags: form.styleTags || [],
        sceneTags: form.sceneTags || [],

        temperatureMin: Number(form.temperatureMin),
        temperatureMax: Number(form.temperatureMax),

        material: form.material || '',
        fit: form.fit || 'regular',

        sourceType: 'image',
        sourceLink: '',

        aiRecognized: true,
        aiConfidence: form.aiConfidence || 0.6,
        userConfirmed: true,

        wearCount: 0,
        lastWornAt: null,
        status: 'active'
      }

      await clothingService.addClothing(clothingData)

      wx.hideLoading()

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 800)
    } catch (err) {
      wx.hideLoading()
      wx.showToast({
        title: err.message || '保存失败',
        icon: 'none'
      })
    } finally {
      this.setData({ saving: false })
    }
  },

  goWardrobes() {
    wx.navigateTo({
      url: '/pages/wardrobes/wardrobes'
    })
  }
})