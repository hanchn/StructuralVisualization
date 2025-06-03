class LogicTemplate {
  /**
   * 生成文件头部
   */
  generateHeader(fileName, apiMethodNames) {
    return `// 自动生成的逻辑处理文件
// 生成时间: ${new Date().toLocaleString()}

import {
  ${apiMethodNames.join(',\n  ')}
} from './${fileName}-api.js';
`;
  }

  /**
   * 生成单个逻辑方法
   */
  generateMethod(api, apiMethodName, logicMethodName) {
    const { pathParams, queryParams, bodyParams } = api;
    
    // 构建参数列表
    const params = this.buildParameterList(api);
    
    // 构建API调用
    const apiCall = this.buildApiCall(api, apiMethodName);
    
    return `
/**
 * ${api.description || `${api.method} ${api.path} 的逻辑处理`}
 * @param {${this.generateParamTypes(api)}} ${params.join(', ')}
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const ${logicMethodName} = async (${params.join(', ')}) => {
  try {
    ${this.generateValidation(api)}
    
    ${apiCall}
    
    // 数据处理（可根据需要自定义）
    const processedData = this.processResponseData(result);
    
    return {
      success: true,
      data: processedData
    };
  } catch (error) {
    console.error('\`${logicMethodName} error:\`', error);
    return {
      success: false,
      error: error.message || '请求失败'
    };
  }
};

/**
 * 处理 ${logicMethodName} 的响应数据
 */
function processResponseData(data) {
  // 这里可以添加数据处理逻辑
  // 例如：数据格式化、字段映射、默认值设置等
  return data;
}`;
  }

  /**
   * 构建参数列表
   */
  buildParameterList(api) {
    const { pathParams, queryParams, bodyParams } = api;
    const params = [];
    
    // 路径参数
    pathParams.forEach(param => {
      params.push(param);
    });
    
    // body参数
    if (bodyParams.length > 0) {
      params.push('data');
    }
    
    // query参数
    if (queryParams.length > 0) {
      params.push('options = {}');
    }
    
    return params;
  }

  /**
   * 构建API调用代码
   */
  buildApiCall(api, apiMethodName) {
    const { pathParams, queryParams, bodyParams } = api;
    const callParams = [];
    
    // 路径参数
    pathParams.forEach(param => {
      callParams.push(param);
    });
    
    // body参数
    if (bodyParams.length > 0) {
      callParams.push('data');
    }
    
    // query参数
    if (queryParams.length > 0) {
      callParams.push('options');
    }
    
    return `const result = await ${apiMethodName}(${callParams.join(', ')});`;
  }

  /**
   * 生成参数验证代码
   */
  generateValidation(api) {
    const validations = [];
    
    // 路径参数验证
    api.pathParams.forEach(param => {
      validations.push(`if (!${param}) throw new Error('${param} is required');`);
    });
    
    // body参数验证
    if (api.bodyParams.length > 0) {
      validations.push(`if (!data || typeof data !== 'object') throw new Error('data is required');`);
    }
    
    return validations.length > 0 ? 
      `// 参数验证\n    ${validations.join('\n    ')}\n` : 
      '// 无需参数验证\n';
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
      types.push('data: Object');
    }
    
    if (api.queryParams.length > 0) {
      types.push('options?: Object');
    }
    
    return types.join(', ');
  }

  /**
   * 生成导出语句
   */
  generateExports(methodNames) {
    return `\n// 导出所有逻辑方法
export {
  ${methodNames.join(',\n  ')}
};`;
  }
}

module.exports = LogicTemplate;