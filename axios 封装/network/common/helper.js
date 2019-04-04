import { GLOBAL_HEADER } from "./const";

async function getNetworkHeader() {
  const headers = Object.assign({}, GLOBAL_HEADER);
  const userInfo = {}; // 这里可以根据各自的业务配置
  if (userInfo) {
    headers.token = userInfo.token;
    headers.userId = userInfo.userId;
  }
  return headers;
}

export { getNetworkHeader };
