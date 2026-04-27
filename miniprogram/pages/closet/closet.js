const clothingService = require('../../services/clothingService')

Page({
  data: {
    loading: false,
    errorMessage: '',
    currentCategory: 'all',

    categories: [
      { label: '全部', value: 'all' },
      { label: '上衣', value: 'top' },
      { label: '下装', value: 'bottom' },
      { label: '外套', value: 'outerwear' },
      { label: '裙装', value: 'dress' },
      { label: '鞋', value: 'shoes' },
      { label: '包', value: 'bag' },
      { label: '配饰', value: 'accessory' },
      { label: '其他', value: 'other' }
    ],

    clothes: []
  },

  onShow() {
    this.loadClothes()
  },

  async loadClothes() {
    this.setData({
      loading: true,
      errorMessage: ''
    })

    try {
      console.log('[closet] 准备读取衣物，分类：', this.data.currentCategory)

      const result = await clothingService.listClothes({
        category: this.data.currentCategory
      })

      console.log('[closet] listClothes 返回：', result)

      if (!result || !result.success) {
        this.setData({
          clothes: [],
          errorMessage: result?.errorMessage || '读取衣物失败'
        })
        return
      }

      this.setData({
        clothes: result.data || [],
        errorMessage: ''
      })
    } catch (error) {
      console.error('[closet loadClothes error]', error)

      this.setData({
        clothes: [],
        errorMessage: '页面读取衣物失败，请查看控制台'
      })
    } finally {
      this.setData({
        loading: false
      })
    }
  },

  onCategoryTap(event) {
    const category = event.currentTarget.dataset.category

    if (!category || category === this.data.currentCategory) {
      return
    }

    this.setData({
      currentCategory: category
    })

    this.loadClothes()
  },

  onAddTap() {
    wx.navigateTo({
      url: '/pages/add-item/add-item'
    })
  },

  onItemTap(event) {
    const id = event.currentTarget.dataset.id

    if (!id) {
      return
    }

    wx.showToast({
      title: '详情页后续开发',
      icon: 'none'
    })
  }
})