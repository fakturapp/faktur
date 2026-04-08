interface ParsedUserAgent {
  browser: string
  browserVersion: string
  os: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
}

export function parseUserAgent(ua: string): ParsedUserAgent {
  const result: ParsedUserAgent = {
    browser: 'Unknown',
    browserVersion: '',
    os: 'Unknown',
    deviceType: 'desktop',
  }

  if (!ua) return result

  if (/Edg(?:e|A)?\/(\d+[\d.]*)/i.test(ua)) {
    result.browser = 'Edge'
    result.browserVersion = RegExp.$1
  } else if (/OPR\/(\d+[\d.]*)/i.test(ua)) {
    result.browser = 'Opera'
    result.browserVersion = RegExp.$1
  } else if (/Chrome\/(\d+[\d.]*)/i.test(ua)) {
    result.browser = 'Chrome'
    result.browserVersion = RegExp.$1
  } else if (/Firefox\/(\d+[\d.]*)/i.test(ua)) {
    result.browser = 'Firefox'
    result.browserVersion = RegExp.$1
  } else if (/Version\/(\d+[\d.]*).*Safari/i.test(ua)) {
    result.browser = 'Safari'
    result.browserVersion = RegExp.$1
  } else if (/Safari\/(\d+[\d.]*)/i.test(ua)) {
    result.browser = 'Safari'
    result.browserVersion = RegExp.$1
  }

  if (/Windows NT 10/i.test(ua)) {
    result.os = 'Windows'
  } else if (/Windows/i.test(ua)) {
    result.os = 'Windows'
  } else if (/Mac OS X/i.test(ua)) {
    result.os = 'macOS'
  } else if (/Android/i.test(ua)) {
    result.os = 'Android'
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    result.os = 'iOS'
  } else if (/Linux/i.test(ua)) {
    result.os = 'Linux'
  } else if (/CrOS/i.test(ua)) {
    result.os = 'ChromeOS'
  }

  if (/iPad|tablet/i.test(ua)) {
    result.deviceType = 'tablet'
  } else if (/Mobile|iPhone|iPod|Android.*Mobile|webOS|BlackBerry|Opera Mini|IEMobile/i.test(ua)) {
    result.deviceType = 'mobile'
  } else {
    result.deviceType = 'desktop'
  }

  if (result.browserVersion) {
    const parts = result.browserVersion.split('.')
    result.browserVersion = parts.slice(0, 2).join('.')
  }

  return result
}
