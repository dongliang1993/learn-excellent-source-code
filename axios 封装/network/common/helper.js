import { GLOBAL_HEADER } from './const'
import { getUserInfo } from 'Utils/sdk'
import browser from 'Utils/browser'
const {
  version: { AlaLiveAppVersion }
} = browser

async function getNetworkHeader () {
  const userInfo = await getUserInfo()
  const headers = Object.assign({}, GLOBAL_HEADER)
  if (userInfo) {
    headers.token = userInfo.token
    headers.sign = userInfo.token
    headers['userId'] = userInfo.userId // '9532'
    if (AlaLiveAppVersion) {
      headers['appVersion'] = AlaLiveAppVersion
    }
  }
  return headers
}

export { getNetworkHeader }
