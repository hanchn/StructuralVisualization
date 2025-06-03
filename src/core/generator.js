/**
 * 前端API代码生成器
 * 支持多种前端框架和HTTP客户端
 */
export class CodeGenerator {
  constructor(options = {}) {
    this.options = {
      framework: 'vanilla', // vanilla, react, vue
      httpClient: 'fetch', // fetch, axios, request
      typescript: false,
      baseURL: '',
      ...options
    };
  }

  /**
   * 从AST生成前端代码
   * @param {Object} ast - API AST
   * @returns {string} 生成的代码
   */
  generate(ast) {
    const imports = this.generateImports();
    const baseConfig = this.generateBaseConfig(ast.info);
    const apiMethods = this.generateAPIMethods(ast.children);
    const exports = this.generateExports(ast.children);

    return [imports, baseConfig, apiMethods, exports]
      .filter(Boolean)
      .join('\n\n');
  }

  /**
   * 生成导入语句
   */
  generateImports() {
    const { httpClient, typescript } = this.options;
    
    if (httpClient === 'axios') {
      return typescript 
        ? "import axios, { AxiosResponse } from 'axios';"
        : "import axios from 'axios';";
    }
    
    return ''; // fetch是原生的，不需要导入
  }

  /**
   * 生成基础配置
   */
  generateBaseConfig(info) {
    const { httpClient, baseURL, typescript } = this.options;
    
    if (httpClient === 'axios') {
      return `// API配置
const apiClient = axios.create({
  baseURL: '${baseURL || info.servers?.[0]?.url || ''}',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});`;
    }
    
    return `// API配置
const BASE_URL = '${baseURL || ''}';
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
};`;
  }

  /**
   * 生成API方法
   */
  generateAPIMethods(apiNodes) {
    return apiNodes.map(node => this.generateAPIMethod(node)).join('\n\n');
  }

  /**
   * 生成单个API方法
   */
  generateAPIMethod(apiNode) {
    const { operationId, method, path, summary, children } = apiNode;
    const { parameters, requestBody, responses } = children;
    
    const methodName = operationId;
    const params = this.generateMethodParameters(parameters, requestBody);
    const pathWithParams = this.generatePathWithParams(path, parameters);
    const requestConfig = this.generateRequestConfig(method, pathWithParams, parameters, requestBody);
    const returnType = this.generateReturnType(responses);
    
    const { typescript } = this.options;
    
    if (typescript) {
      return `/**
 * ${summary}
 */
export async function ${methodName}(${params.typescript})${returnType} {
${requestConfig}
}`;
    }
    
    return `/**
 * ${summary}
 */
export async function ${methodName}(${params.javascript}) {
${requestConfig}
}`;
  }

  /**
   * 生成方法参数
   */
  generateMethodParameters(parametersNode, requestBodyNode) {
    const params = [];
    const tsParams = [];
    
    // 路径参数和查询参数
    if (parametersNode && parametersNode.children) {
      parametersNode.children.forEach(param => {
        const { name, required, schema } = param;
        const tsType = this.getTypeScriptType(schema);
        
        if (required) {
          params.push(name);
          tsParams.push(`${name}: ${tsType}`);
        } else {
          params.push(`${name} = null`);
          tsParams.push(`${name}?: ${tsType}`);
        }
      });
    }
    
    // 请求体参数
    if (requestBodyNode) {
      const bodyType = this.getRequestBodyType(requestBodyNode);
      params.push('data');
      tsParams.push(`data: ${bodyType}`);
    }
    
    return {
      javascript: params.join(', '),
      typescript: tsParams.join(', ')
    };
  }

  /**
   * 生成带参数的路径
   */
  generatePathWithParams(path, parametersNode) {
    let processedPath = path;
    
    if (parametersNode && parametersNode.children) {
      parametersNode.children.forEach(param => {
        if (param.in === 'path') {
          processedPath = processedPath.replace(`{${param.name}}`, `\${${param.name}}`);
        }
      });
    }
    
    return processedPath;
  }

  /**
   * 生成请求配置
   */
  generateRequestConfig(method, path, parametersNode, requestBodyNode) {
    const { httpClient } = this.options;
    
    if (httpClient === 'axios') {
      return this.generateAxiosRequest(method, path, parametersNode, requestBodyNode);
    }
    
    return this.generateFetchRequest(method, path, parametersNode, requestBodyNode);
  }

  /**
   * 生成Axios请求
   */
  generateAxiosRequest(method, path, parametersNode, requestBodyNode) {
    const queryParams = this.getQueryParameters(parametersNode);
    const hasData = requestBodyNode && ['POST', 'PUT', 'PATCH'].includes(method);
    
    let config = `{
    method: '${method}',
    url: \`${path}\``;
    
    if (queryParams.length > 0) {
      config += `,\n    params: { ${queryParams.join(', ')} }`;
    }
    
    if (hasData) {
      config += `,\n    data`;
    }
    
    config += '\n  }';
    
    return `  try {
    const response = await apiClient.request(${config});
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }`;
  }

  /**
   * 生成Fetch请求
   */
  generateFetchRequest(method, path, parametersNode, requestBodyNode) {
    const queryParams = this.getQueryParameters(parametersNode);
    const hasData = requestBodyNode && ['POST', 'PUT', 'PATCH'].includes(method);
    
    let url = `\`\${BASE_URL}${path}\``;
    
    if (queryParams.length > 0) {
      const queryString = queryParams.map(param => `${param}=\${encodeURIComponent(${param})}`).join('&');
      url += ` + '?' + \`${queryString}\``;
    }
    
    let fetchConfig = `{
    method: '${method}',
    headers: DEFAULT_HEADERS`;
    
    if (hasData) {
      fetchConfig += `,\n    body: JSON.stringify(data)`;
    }
    
    fetchConfig += '\n  }';
    
    return `  try {
    const response = await fetch(${url}, ${fetchConfig});
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }`;
  }

  /**
   * 获取查询参数
   */
  getQueryParameters(parametersNode) {
    if (!parametersNode || !parametersNode.children) return [];
    
    return parametersNode.children
      .filter(param => param.in === 'query')
      .map(param => param.name);
  }

  /**
   * 生成返回类型
   */
  generateReturnType(responsesNode) {
    if (!this.options.typescript) return '';
    
    // 简化处理，返回Promise<any>
    return ': Promise<any>';
  }

  /**
   * 生成导出语句
   */
  generateExports(apiNodes) {
    const methodNames = apiNodes.map(node => node.operationId);
    return `\n// 导出所有API方法\nexport { ${methodNames.join(', ')} };`;
  }

  /**
   * 获取TypeScript类型
   */
  getTypeScriptType(schema) {
    if (!schema) return 'any';
    
    switch (schema.type) {
      case 'string': return 'string';
      case 'number': 
      case 'integer': return 'number';
      case 'boolean': return 'boolean';
      case 'array': return 'any[]';
      case 'object': return 'any';
      default: return 'any';
    }
  }

  /**
   * 获取请求体类型
   */
  getRequestBodyType(requestBodyNode) {
    // 简化处理，返回any
    return 'any';
  }

  // 在 CodeGenerator 类中添加
  
  /**
   * 生成平台特定的响应处理
   */
  generatePlatformResponse(platform = 'standard') {
    const mapper = new DataMapper({ platform });
    const rules = mapper.mappingRules[platform];
    
    switch (platform) {
      case 'wechat':
        return `
    // 微信小程序响应处理
    if (response.${rules.code} !== 0) {
      throw new Error(response.${rules.message} || '请求失败');
    }
    return response.${rules.success};`;
    
      case 'alipay':
        return `
    // 支付宝小程序响应处理
    if (response.${rules.code} !== '200') {
      throw new Error(response.${rules.message} || '请求失败');
    }
    return response.${rules.success};`;
    
      default:
        return `
    // 标准响应处理
    if (response.${rules.code} !== 200) {
      throw new Error(response.${rules.message} || '请求失败');
    }
    return response.${rules.success};`;
    }
  }
}