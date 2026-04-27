function ensureSuccess(res, defaultMessage) {
  if (!res || !res.result || !res.result.success) {
    throw new Error(
      (res && res.result && (res.result.errorMessage || res.result.message)) ||
        defaultMessage
    )
  }

  return res.result.data
}

async function recognizeClothing(payload) {
  let imageUrl = ''
  let title = ''
  let sourceType = 'image'

  if (typeof payload === 'string') {
    imageUrl = payload
  }

  if (payload && typeof payload === 'object') {
    imageUrl = payload.imageUrl || ''
    title = payload.title || ''
    sourceType = payload.sourceType || 'image'
  }

  if (!imageUrl) {
    throw new Error('缺少图片地址，无法识别')
  }

  const res = await wx.cloud.callFunction({
    name: 'aiRecognizeClothing',
    data: {
      imageUrl,
      title,
      sourceType
    }
  })

  return ensureSuccess(res, 'AI识别失败')
}

module.exports = {
  recognizeClothing
}