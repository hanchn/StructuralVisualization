class ApiTemplate {
  /**
   * 生成文件头部
   */
  generateHeader(baseUrl) {
    return `// 自动生成的API接口文件
// 生成时间: ${new Date().toLocaleString()}

const BASE_URL = '${baseUrl || ''}';

/**
 * 通用请求方法
 */
const request = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(\`Request failed: \${error.message}\`);
  }
};
`;
  }

  /**
   * 生成单个API方法
   */
  generateMethod(api, methodName) {
    const { path, method, pathParams, queryParams, bodyParams } = api;
    
    // 构建参数列表
    const params = this.buildParameterList(api);
    
    // 构建URL
    const urlBuilder = this.buildUrlBuilder(path, pathParams);
    
    // 构建请求选项
    const optionsBuilder = this.buildOptionsBuilder(method, bodyParams, queryParams);
    
    return `
/**
 * ${api.description || `${method} ${path}`}
 * @param {${this.generateParamTypes(api)}} ${params.join(', ')}
 * @returns {Promise<Object>} API响应
 */
export const ${methodName} = async (${params.join(', ')}) => {
  ${urlBuilder}
  
  ${optionsBuilder}
  
  return await request(url, options);
};`;
  }

  /**
   * 构建参数列表
   */
  buildParameterList(api) {
    const { pathParams, queryParams, bodyParams } = api;
    const params = [];
    
    // 路径参数（必需）
    pathParams.forEach(param => {
      params.push(param);
    });
    
    // 如果有body参数，添加bodyData参数
    if (bodyParams.length > 0) {
      params.push('bodyData');
    }
    
    // 如果有query参数，添加queryParams参数
    if (queryParams.length > 0) {
      params.push('queryParams = {}');
    }
    
    return params;
  }

  /**
   * 构建URL生成代码
   */
  buildUrlBuilder(path, pathParams) {
    let urlCode = `let url = BASE_URL + '${path}';`;
    
    // 替换路径参数
    pathParams.forEach(param => {
      urlCode += `\n  url = url.replace(':${param}', ${param});`;
    });
    
    return urlCode;
  }

  /**
   * 构建请求选项代码
   */
  buildOptionsBuilder(method, bodyParams, queryParams) {
    let optionsCode = `const options = {\n    method: '${method}'`;
    
    // 添加body
    if (bodyParams.length > 0) {
      optionsCode += `,\n    body: JSON.stringify(bodyData)`;
    }
    
    optionsCode += `\n  };`;
    
    // 添加query参数处理
    if (queryParams.length > 0) {
      optionsCode += `\n  \n  // 添加query参数
  if (queryParams && Object.keys(queryParams).length > 0) {
    const urlObj = new URL(url);
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] !== undefined && queryParams[key] !== null) {
        urlObj.searchParams.append(key, queryParams[key]);
      }
    });
    url = urlObj.toString();
  }`;
    }
    
    return optionsCode;
  }

  /**
   * 生成参数类型注释
   */
  generateParamTypes(api) {
    const types = [];
    
    api.pathParams.forEach(param => {
      types.push(`${param}: string|number`);
    });
    
    if (api.bodyParams.length > 0) {
      types.push('bodyData: Object');
    }
    
    if (api.queryParams.length > 0) {
      types.push('queryParams?: Object');
    }
    
    return types.join(', ');
  }

  /**
   * 生成导出语句
   */
  generateExports(methodNames) {
    return `\n// 导出所有API方法
export {
  ${methodNames.join(',\n  ')}
};`;
  }
}

module.exports = ApiTemplate;