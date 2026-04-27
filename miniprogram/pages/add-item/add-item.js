const clothingService = require('../../services/clothingService')
const aiService = require('../../services/aiService')

const defaultForm = {
  name: '',
  imageUrl: '',
  category: '',
  subCategory: '',
  color: '',
  colorName: '',
  thickness: '',
  warmLevel: '',
  season: [],
  styleTags: [],
  sceneTags: [],
  temperatureMin: '',
  temperatureMax: '',
  material: '',
  fit: '',
  sourceType: 'image',
  sourceLink: '',
  aiConfidence: 0
}

Page({
  data: {
    imageUrl: '',
    imageCloudPath: '',

    form: { ...defaultForm },

    categoryLabel: '',
    thicknessLabel: '',
    warmLevelLabel: '',

    styleTagsText: '',
    sceneTagsText: '',

    recognizing: false,
    saving: false,
    hasRecognized: false,
    userHasConfirmed: false,

    categoryOptions: [
      { label: '上衣', value: 'top' },
      { label: '下装', value: 'bottom' },
      { label: '外套', value: 'outerwear' },
      { label: '连衣裙', value: 'dress' },
      { label: '鞋', value: 'shoes' },
      { label: '包', value: 'bag' },
      { label: '配饰', value: 'accessory' },
      { label: '内搭/贴身', value: 'underwear' },
      { label: '宠物衣物', value: 'pet' },
      { label: '其他', value: 'other' }
    ],

    thicknessOptions: [
      { label: '薄', value: 'thin' },
      { label: '中等', value: 'medium' },
      { label: '厚', value: 'thick' },
      { label: '加厚', value: 'extra' }
    ],

    warmLevelOptions: [
      { label: '1 极薄', value: 1 },
      { label: '2 薄', value: 2 },
      { label: '3 常规', value: 3 },
      { label: '4 偏厚', value: 4 },
      { label: '5 厚', value: 5 },
      { label: '6 加厚', value: 6 }
    ],

    seasonOptions: [
      { label: '春', value: 'spring' },
      { label: '夏', value: 'summer' },
      { label: '秋', value: 'autumn' },
      { label: '冬', value: 'winter' }
    ]
  },

  async chooseImage() {
    try {
      const chooseRes = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed']
      })

      if (!chooseRes.tempFiles || chooseRes.tempFiles.length === 0) {
        throw new Error('未选择图片')
      }

      const tempFilePath = chooseRes.tempFiles[0].tempFilePath

      wx.showLoading({
        title: '上传中...'
      })

      const uploadRes = await clothingService.uploadClothingImage(tempFilePath)

      wx.hideLoading()

      this.setData({
        imageUrl: uploadRes.fileID,
        imageCloudPath: uploadRes.cloudPath,
        form: {
          ...defaultForm,
          imageUrl: uploadRes.fileID
        },
        categoryLabel: '',
        thicknessLabel: '',
        warmLevelLabel: '',
        styleTagsText: '',
        sceneTagsText: '',
        hasRecognized: false,
        userHasConfirmed: false
      })

      await this.recognizeImage(uploadRes.fileID)
    } catch (err) {
      wx.hideLoading()

      if (err && err.errMsg && err.errMsg.includes('cancel')) {
        return
      }

      console.error('chooseImage failed:', err)
      wx.showToast({
        title: err.message || '图片上传失败',
        icon: 'none'
      })
    }
  },

  async recognizeImage(imageUrl) {
    try {
      this.setData({
        recognizing: true
      })

      const aiResult = await aiService.recognizeClothing({
        imageUrl,
        sourceType: 'image'
      })

      const nextForm = {
        ...this.data.form,
        ...aiResult,
        imageUrl,
        sourceType: 'image',
        sourceLink: '',
        aiConfidence: Number(aiResult.aiConfidence || 0)
      }

      this.setData({
        form: nextForm,
        categoryLabel: this.getLabel(this.data.categoryOptions, nextForm.category),
        thicknessLabel: this.getLabel(this.data.thicknessOptions, nextForm.thickness),
        warmLevelLabel: this.getLabel(this.data.warmLevelOptions, Number(nextForm.warmLevel)),
        styleTagsText: (nextForm.styleTags || []).join(','),
        sceneTagsText: (nextForm.sceneTags || []).join(','),
        hasRecognized: true,
        userHasConfirmed: false
      })
    } catch (err) {
      console.error('recognizeImage failed:', err)

      this.setData({
        hasRecognized: false,
        userHasConfirmed: false
      })

      wx.showToast({
        title: 'AI识别失败，请手动填写',
        icon: 'none'
      })
    } finally {
      this.setData({
        recognizing: false
      })
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value

    this.setData({
      [`form.${field}`]: value,
      userHasConfirmed: false
    })
  },

  onTagsInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value

    this.setData({
      [field]: value,
      userHasConfirmed: false
    })
  },

  onCategoryChange(e) {
    const option = this.data.categoryOptions[e.detail.value]

    this.setData({
      'form.category': option.value,
      categoryLabel: option.label,
      userHasConfirmed: false
    })
  },

  onThicknessChange(e) {
    const option = this.data.thicknessOptions[e.detail.value]

    this.setData({
      'form.thickness': option.value,
      thicknessLabel: option.label,
      userHasConfirmed: false
    })
  },

  onWarmLevelChange(e) {
    const option = this.data.warmLevelOptions[e.detail.value]

    this.setData({
      'form.warmLevel': option.value,
      warmLevelLabel: option.label,
      userHasConfirmed: false
    })
  },

  onSeasonChange(e) {
    this.setData({
      'form.season': e.detail.value,
      userHasConfirmed: false
    })
  },

  confirmRecognizedResult() {
    const checkResult = this.validateFormBeforeConfirm()

    if (!checkResult.valid) {
      wx.showToast({
        title: checkResult.message,
        icon: 'none'
      })
      return
    }

    this.setData({
      userHasConfirmed: true
    })

    wx.showToast({
      title: '已确认',
      icon: 'success'
    })
  },

  async saveClothing() {
    if (this.data.saving) {
      return
    }

    try {
      if (!this.data.userHasConfirmed) {
        throw new Error('请先确认识别结果')
      }

      const userId = wx.getStorageSync('userId')
      const wardrobeId = wx.getStorageSync('wardrobeId')

      const clothing = {
        ...this.data.form,
        styleTags: this.parseTags(this.data.styleTagsText),
        sceneTags: this.parseTags(this.data.sceneTagsText),
        temperatureMin: Number(this.data.form.temperatureMin),
        temperatureMax: Number(this.data.form.temperatureMax),
        warmLevel: Number(this.data.form.warmLevel),
        aiRecognized: this.data.hasRecognized,
        aiConfidence: Number(this.data.form.aiConfidence || 0),
        userConfirmed: true
      }

      this.setData({
        saving: true
      })

      const result = await clothingService.addClothing({
        userId,
        wardrobeId,
        clothing
      })

      console.log('add clothing success:', result)

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })

      setTimeout(() => {
        this.resetPageAfterSave()
      }, 800)
    } catch (err) {
      console.error('saveClothing failed:', err)
      wx.showToast({
        title: err.message || '保存失败',
        icon: 'none'
      })
    } finally {
      this.setData({
        saving: false
      })
    }
  },

  resetPageAfterSave() {
    this.setData({
      imageUrl: '',
      imageCloudPath: '',
      form: { ...defaultForm },
      categoryLabel: '',
      thicknessLabel: '',
      warmLevelLabel: '',
      styleTagsText: '',
      sceneTagsText: '',
      recognizing: false,
      saving: false,
      hasRecognized: false,
      userHasConfirmed: false
    })
  },

  validateFormBeforeConfirm() {
    const form = this.data.form

    if (!form.imageUrl) return { valid: false, message: '请先上传图片' }
    if (!form.name) return { valid: false, message: '请填写衣物名称' }
    if (!form.category) return { valid: false, message: '请选择分类' }
    if (!form.subCategory) return { valid: false, message: '请填写子分类' }
    if (!form.color) return { valid: false, message: '请填写颜色代码' }
    if (!form.colorName) return { valid: false, message: '请填写颜色名称' }
    if (!form.thickness) return { valid: false, message: '请选择厚度' }
    if (!form.warmLevel) return { valid: false, message: '请选择保暖等级' }

    if (!Array.isArray(form.season) || form.season.length === 0) {
      return { valid: false, message: '请选择季节' }
    }

    const temperatureMin = Number(form.temperatureMin)
    const temperatureMax = Number(form.temperatureMax)

    if (Number.isNaN(temperatureMin)) {
      return { valid: false, message: '最低温度必须是数字' }
    }

    if (Number.isNaN(temperatureMax)) {
      return { valid: false, message: '最高温度必须是数字' }
    }

    if (temperatureMin > temperatureMax) {
      return { valid: false, message: '最低温度不能高于最高温度' }
    }

    return { valid: true, message: '' }
  },

  parseTags(text) {
    if (!text) return []

    return text
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  },

  getLabel(options, value) {
    const found = options.find(item => item.value === value)
    return found ? found.label : ''
  }
})