const wardrobeService = require('../../services/wardrobeService')

Page({
  data: {
    loading: false,
    wardrobes: [],
    currentWardrobeId: '',
    showForm: false,
    form: {
      name: '',
      type: 'human',
      ownerName: '',
      ownerRole: 'self',
      gender: 'unknown',
      ageGroup: 'adult'
    }
  },

  onShow() {
    this.loadWardrobes()
  },

  async loadWardrobes() {
    try {
      this.setData({ loading: true })

      const result = await wardrobeService.getWardrobes()

      this.setData({
        wardrobes: result.wardrobes,
        currentWardrobeId: result.currentWardrobe ? result.currentWardrobe._id : ''
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  async onSwitchWardrobe(e) {
    const wardrobeId = e.currentTarget.dataset.id

    try {
      wx.showLoading({ title: '切换中' })

      const wardrobe = await wardrobeService.switchWardrobe(wardrobeId)

      this.setData({
        currentWardrobeId: wardrobe._id
      })

      wx.showToast({
        title: '已切换',
        icon: 'success'
      })
    } catch (err) {
      wx.showToast({
        title: err.message || '切换失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  async onSetDefault(e) {
    const wardrobeId = e.currentTarget.dataset.id

    try {
      wx.showLoading({ title: '设置中' })

      await wardrobeService.setDefaultWardrobe(wardrobeId)

      wx.showToast({
        title: '已设为默认',
        icon: 'success'
      })

      this.loadWardrobes()
    } catch (err) {
      wx.showToast({
        title: err.message || '设置失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  openForm() {
    this.setData({
      showForm: true,
      form: {
        name: '',
        type: 'human',
        ownerName: '',
        ownerRole: 'self',
        gender: 'unknown',
        ageGroup: 'adult'
      }
    })
  },

  closeForm() {
    this.setData({
      showForm: false
    })
  },

  onInputName(e) {
    this.setData({
      'form.name': e.detail.value,
      'form.ownerName': e.detail.value
    })
  },

  onInputOwnerName(e) {
    this.setData({
      'form.ownerName': e.detail.value
    })
  },

  onTypeChange(e) {
    const type = e.detail.value

    this.setData({
      'form.type': type,
      'form.ownerRole': type === 'pet' ? 'pet' : 'family',
      'form.ageGroup': type === 'pet' ? 'pet' : 'adult'
    })
  },

  onOwnerRoleChange(e) {
    this.setData({
      'form.ownerRole': e.detail.value
    })
  },

  onGenderChange(e) {
    this.setData({
      'form.gender': e.detail.value
    })
  },

  onAgeGroupChange(e) {
    this.setData({
      'form.ageGroup': e.detail.value
    })
  },

  async onCreateWardrobe() {
    const form = this.data.form

    if (!form.name || !form.name.trim()) {
      wx.showToast({
        title: '请输入衣柜名称',
        icon: 'none'
      })
      return
    }

    try {
      wx.showLoading({ title: '创建中' })

      const wardrobe = await wardrobeService.createWardrobe({
        ...form,
        name: form.name.trim(),
        ownerName: form.ownerName || form.name.trim()
      })

      await wardrobeService.switchWardrobe(wardrobe._id)

      wx.showToast({
        title: '创建成功',
        icon: 'success'
      })

      this.setData({
        showForm: false
      })

      this.loadWardrobes()
    } catch (err) {
      wx.showToast({
        title: err.message || '创建失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  }
})