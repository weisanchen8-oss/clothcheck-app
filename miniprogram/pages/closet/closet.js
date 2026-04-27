const clothingService = require('../../services/clothingService')
const wardrobeService = require('../../services/wardrobeService')

Page({
  data: {
    loading: false,

    categories: [
      { label: '上衣', value: 'top' },
      { label: '外套', value: 'outerwear' },
      { label: '裙装', value: 'dress' },
      { label: '鞋', value: 'shoes' },
      { label: '包', value: 'bag' },
      { label: '配饰', value: 'accessory' },
      { label: '其他', value: 'other' }
    ],

    currentCategory: 'top',
    clothes: [],
    filteredClothes: [],

    currentWardrobe: null,
    currentWardrobeId: ''
  },

  onShow() {
    this.initPage()
  },

  async initPage() {
    try {
      this.setData({ loading: true })

      const wardrobeResult = await wardrobeService.getWardrobes()
      const currentWardrobe = wardrobeResult.currentWardrobe

      if (!currentWardrobe || !currentWardrobe._id) {
        wx.showToast({
          title: '请先创建衣柜',
          icon: 'none'
        })
        return
      }

      this.setData({
        currentWardrobe,
        currentWardrobeId: currentWardrobe._id
      })
      
      wx.setNavigationBarTitle({
        title: currentWardrobe.name || '我的衣橱'
      })

      await this.loadClothes()
    } catch (err) {
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadClothes() {
    const wardrobeId = this.data.currentWardrobeId

    if (!wardrobeId) {
      return
    }

    const clothes = await clothingService.getClothesByWardrobe(wardrobeId)

    this.setData({
      clothes
    })

    this.filterClothes()
  },

  filterClothes() {
    const { clothes, currentCategory } = this.data

    const filteredClothes = clothes.filter(item => {
      return item.category === currentCategory
    })

    this.setData({
      filteredClothes
    })
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category

    this.setData({
      currentCategory: category
    })

    this.filterClothes()
  },

  goAddItem() {
    wx.navigateTo({
      url: '/pages/add-item/add-item'
    })
  },

  goWardrobes() {
    wx.navigateTo({
      url: '/pages/wardrobes/wardrobes'
    })
  },

  onClothingTap(e) {
    const id = e.currentTarget.dataset.id

    if (!id) {
      return
    }

    wx.showToast({
      title: '衣物详情页后续开发',
      icon: 'none'
    })
  }
})