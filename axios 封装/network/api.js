import axios from "axios";
import _merge from "lodash/merge";
import {
  CODE_MESSAGE,
  DEFAULT_NETWORK_PARAMS,
  API_PREFIX,
  SUCCESS_RESPONSE_COCE
} from "./common/const";
import { getNetworkHeader } from "./common/helper";

/**
 * catch error
 * @param config
 * @returns {Error}
 * @constructor
 */
function CatchError(config) {
  const error = new Error(config.message);
  for (const key in config) {
    error[key] = config[key];
  }
  return error;
}

/**
 * 网络层状态校验
 * @param response
 * @returns {*}
 */
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const errorText = CODE_MESSAGE[response.status] || response.statusText;
    const catchError = CatchError({
      message: errorText,
      status: response.status,
      code: response.status
    });
    throw catchError;
  }
}

/**
 * 序列化JSON
 * @param response
 * @returns {*}
 */
function parseJSON(response) {
  return response.data;
}

/**
 * 业务层状态校验
 * @param response
 * @returns {*}
 */
function errorFilter(result) {
  // 这部分是前后端约定的统一格式
  // 比如我们公司的约定如下：
  // {
  //   code: 1000,
  //   data: {
  //     list: []
  //   },
  //   msg: ''
  // }
  // 所以在这里根据 code 统一处理
  if (result.code === SUCCESS_RESPONSE_COCE) {
    return result.data;
  } else {
    const catchError = CatchError({
      message: result.msg,
      code: result.code
    });
    throw catchError;
  }
}

/**
 * 网络请求错误转换
 * @param error
 */
function errorCatch(error) {
  if (error.response) {
    const errorText =
      CODE_MESSAGE[error.response.status] || error.response.statusText;
    const catchError = CatchError({
      message: errorText,
      status: error.response.status,
      code: error.response.status
    });
    throw catchError;
  } else {
    const errorText = CODE_MESSAGE[error.code] || error.message;
    const catchError = CatchError({
      message: errorText,
      code: error.code
    });
    throw catchError;
  }
}

export async function get(url = "", params = {}) {
  return axios(
    _merge(DEFAULT_NETWORK_PARAMS, {
      method: "GET",
      url: `${API_PREFIX}${url}`,
      params,
      headers: await getNetworkHeader()
    })
  )
    .then(checkStatus)
    .then(parseJSON)
    .then(errorFilter)
    .catch(errorCatch);
}

export async function post(url = "", params = {}) {
  return axios(
    _merge({
      method: "POST",
      url: `${API_PREFIX}${url}`,
      data: params,
      headers: await getNetworkHeader()
    })
  )
    .then(checkStatus)
    .then(parseJSON)
    .then(errorFilter)
    .catch(errorCatch);
}

export async function fetch(options = {}) {
  const newOptions = _merge(DEFAULT_NETWORK_PARAMS, options, {
    url: `${API_PREFIX}${options.url}`,
    headers: _merge((options.headers = {}), await getNetworkHeader())
  });
  return axios(newOptions)
    .then(checkStatus)
    .then(parseJSON)
    .catch(errorCatch);
}

export default {
  get,
  post,
  fetch
};
