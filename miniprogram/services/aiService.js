function ensureSuccess(res, defaultMessage) {
  if (!res || !res.result || !res.result.success) {
    throw new Error((res && res.result && res.result.message) || defaultMessage)
  }

  return res.result.data
}

async function recognizeClothing(payload) {
  if (!payload || !payload.imageUrl) {
    throw new Error('缺少图片地址，无法识别')
  }

  const res = await wx.cloud.callFunction({
    name: 'aiRecognizeClothing',
    data: {
      imageUrl: payload.imageUrl,
      title: payload.title || '',
      sourceType: payload.sourceType || 'image'
    }
  })

  return ensureSuccess(res, 'AI识别失败')
}

module.exports = {
  recognizeClothing
}