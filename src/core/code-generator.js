/**
 * 代码生成器 - 负责生成API接口代码和逻辑处理代码
 * @author Your Name
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const NamingGenerator = require('./naming-generator');

class CodeGenerator {
  constructor(config = {}) {
    this.config = config;
    this.namingGenerator = new NamingGenerator(config.naming || {});
    this.templates = {
      api: this.getApiTemplate(),
      logic: this.getLogicTemplate(),
      types: this.getTypesTemplate()
    };
  }

  /**
   * 生成所有代码文件
   * @param {Object} apiData - API数据
   * @param {string} apiData.pid - 项目ID
   * @param {string} apiData.cid - 模块ID
   * @param {Array} apiData.apis - API列表
   * @param {Object} options - 生成选项
   * @returns {Promise<Object>} 生成结果
   */
  async generateAll(apiData, options = {}) {
    const { pid, cid, apis } = apiData;
    const {
      outputDir = './output',
      mockMode = false,
      overwrite = false
    } = options;

    const result = {
      success: true,
      files: [],
      errors: [],
      summary: null
    };

    try {
      // 确保输出目录存在
      await this.ensureDirectories(outputDir);

      // 生成API接口文件
      const apiResult = await this.generateApiFile(pid, cid, apis, {
        outputDir: path.join(outputDir, 'api'),
        mockMode,
        overwrite
      });
      result.files.push(apiResult);

      // 生成逻辑处理文件
      const logicResult = await this.generateLogicFile(pid, cid, apis, {
        outputDir: path.join(outputDir, 'logic'),
        mockMode,
        overwrite
      });
      result.files.push(logicResult);

      // 生成类型定义文件
      if (this.config.typescript) {
        const typesResult = await this.generateTypesFile(pid, cid, apis, {
          outputDir: path.join(outputDir, 'types'),
          overwrite
        });
        result.files.push(typesResult);
      }

      // 生成命名摘要
      result.summary = this.namingGenerator.generateNamingSummary(pid, cid, apis);

    } catch (error) {
      result.success = false;
      result.errors.push({
        type: 'generation',
        message: error.message,
        stack: error.stack
      });
    }

    return result;
  }

  /**
   * 生成API接口文件
   * @param {string} pid - 项目ID
   * @param {string} cid - 模块ID
   * @param {Array} apis - API列表
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 生成结果
   */
  async generateApiFile(pid, cid, apis, options = {}) {
    const fileName = this.namingGenerator.generateApiFileName(pid, cid);
    const filePath = path.join(options.outputDir, fileName);

    // 检查文件是否存在
    if (!options.overwrite && await fs.pathExists(filePath)) {
      throw new Error(`API文件已存在: ${filePath}`);
    }

    // 生成API方法
    const apiMethods = apis.map(api => this.generateApiMethod(pid, cid, api, options.mockMode));

    // 生成导入语句
    const imports = this.generateApiImports(options.mockMode);

    // 生成文件内容
    const content = this.templates.api
      .replace('{{imports}}', imports)
      .replace('{{methods}}', apiMethods.join('\n\n'))
      .replace('{{exports}}', this.generateApiExports(pid, cid, apis));

    // 写入文件
    await fs.writeFile(filePath, content, 'utf8');

    return {
      type: 'api',
      path: filePath,
      fileName,
      methods: apiMethods.length,
      size: content.length
    };
  }

  /**
   * 生成逻辑处理文件
   * @param {string} pid - 项目ID
   * @param {string} cid - 模块ID
   * @param {Array} apis - API列表
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 生成结果
   */
  async generateLogicFile(pid, cid, apis, options = {}) {
    const fileName = this.namingGenerator.generateLogicFileName(pid, cid);
    const filePath = path.join(options.outputDir, fileName);

    // 检查文件是否存在
    if (!options.overwrite && await fs.pathExists(filePath)) {
      throw new Error(`逻辑文件已存在: ${filePath}`);
    }

    // 生成逻辑方法
    const logicMethods = apis.map(api => this.generateLogicMethod(pid, cid, api, options.mockMode));

    // 生成导入语句
    const apiFileName = this.namingGenerator.generateApiFileName(pid, cid).replace('.js', '');
    const imports = this.generateLogicImports(apiFileName);

    // 生成文件内容
    const content = this.templates.logic
      .replace('{{imports}}', imports)
      .replace('{{methods}}', logicMethods.join('\n\n'))
      .replace('{{exports}}', this.generateLogicExports(pid, cid, apis));

    // 写入文件
    await fs.writeFile(filePath, content, 'utf8');

    return {
      type: 'logic',
      path: filePath,
      fileName,
      methods: logicMethods.length,
      size: content.length
    };
  }

  /**
   * 生成类型定义文件
   * @param {string} pid - 项目ID
   * @param {string} cid - 模块ID
   * @param {Array} apis - API列表
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 生成结果
   */
  async generateTypesFile(pid, cid, apis, options = {}) {
    const fileName = this.namingGenerator.generateTypesFileName(pid, cid);
    const filePath = path.join(options.outputDir, fileName);

    // 检查文件是否存在
    if (!options.overwrite && await fs.pathExists(filePath)) {
      throw new Error(`类型文件已存在: ${filePath}`);
    }

    // 生成类型定义
    const typeDefinitions = apis.map(api => this.generateTypeDefinition(pid, cid, api));

    // 生成文件内容
    const content = this.templates.types
      .replace('{{types}}', typeDefinitions.join('\n\n'));

    // 写入文件
    await fs.writeFile(filePath, content, 'utf8');

    return {
      type: 'types',
      path: filePath,
      fileName,
      types: typeDefinitions.length,
      size: content.length
    };
  }

  /**
   * 生成API方法
   * @param {string} pid - 项目ID
   * @param {string} cid - 模块ID
   * @param {Object} api - API信息
   * @param {boolean} mockMode - Mock模式
   * @returns {string} 方法代码
   */
  generateApiMethod(pid, cid, api, mockMode = false) {
    const methodName = this.namingGenerator.generateApiMethodName(pid, cid, api.path, api.method);
    const { path: apiPath, method, parameters = [], responses = {} } = api;

    // 生成参数
    const params = this.generateMethodParameters(parameters);
    const paramNames = parameters.map(p => p.name).join(', ');

    // 生成请求配置
    const requestConfig = this.generateRequestConfig(api, mockMode);

    // 生成方法注释
    const comments = this.generateMethodComments(api);

    return `${comments}
export async function ${methodName}(${params}) {
  const config = {
    method: '${method.toUpperCase()}',
    url: \`${this.processApiPath(apiPath)}\`,
    ${requestConfig}
  };

  ${mockMode ? this.generateMockReturn(api) : this.generateApiCall()}
}`;
  }

  /**
   * 生成逻辑方法
   * @param {string} pid - 项目ID
   * @param {string} cid - 模块ID
   * @param {Object} api - API信息
   * @param {boolean} mockMode - Mock模式
   * @returns {string} 方法代码
   */
  generateLogicMethod(pid, cid, api, mockMode = false) {
    const methodName = this.namingGenerator.generateLogicMethodName(pid, cid, api.path, api.method);
    const apiMethodName = this.namingGenerator.generateApiMethodName(pid, cid, api.path, api.method);
    const { parameters = [] } = api;

    // 生成参数
    const params = this.generateMethodParameters(parameters);
    const paramNames = parameters.map(p => p.name).join(', ');

    // 生成方法注释
    const comments = this.generateMethodComments(api, 'logic');

    return `${comments}
export async function ${methodName}(${params}) {
  try {
    const response = await ${apiMethodName}(${paramNames});
    
    // 数据处理逻辑
    const processedData = this.processResponseData(response.data);
    
    return {
      success: true,
      data: processedData,
      message: '操作成功'
    };
  } catch (error) {
    console.error('${methodName} 执行失败:', error);
    
    return {
      success: false,
      data: null,
      message: error.message || '操作失败',
      error: error
    };
  }
}

/**
 * 处理响应数据
 * @param {any} data - 原始数据
 * @returns {any} 处理后的数据
 */
function processResponseData(data) {
  // 在这里添加数据处理逻辑
  return data;
}`;
  }

  /**
   * 生成类型定义
   * @param {string} pid - 项目ID
   * @param {string} cid - 模块ID
   * @param {Object} api - API信息
   * @returns {string} 类型定义代码
   */
  generateTypeDefinition(pid, cid, api) {
    const methodName = this.namingGenerator.generateApiMethodName(pid, cid, api.path, api.method);
    const { parameters = [], responses = {} } = api;

    // 生成参数类型
    const paramTypes = parameters.map(p => `  ${p.name}: ${this.mapToTypeScript(p.type)};`).join('\n');
    
    // 生成响应类型
    const responseType = this.generateResponseType(responses);

    return `// ${api.summary || api.path}
export interface ${methodName}Params {
${paramTypes}
}

export interface ${methodName}Response {
${responseType}
}`;
  }

  /**
   * 生成方法参数
   * @param {Array} parameters - 参数列表
   * @returns {string} 参数字符串
   */
  generateMethodParameters(parameters) {
    if (!parameters || parameters.length === 0) {
      return '';
    }

    return parameters.map(param => {
      const { name, required = false, type = 'any', description } = param;
      const optional = required ? '' : '?';
      const defaultValue = param.default ? ` = ${JSON.stringify(param.default)}` : '';
      
      return `${name}${optional}${defaultValue}`;
    }).join(', ');
  }

  /**
   * 生成请求配置
   * @param {Object} api - API信息
   * @param {boolean} mockMode - Mock模式
   * @returns {string} 请求配置
   */
  generateRequestConfig(api, mockMode) {
    const { method, parameters = [] } = api;
    const config = [];

    // 处理查询参数
    const queryParams = parameters.filter(p => p.in === 'query');
    if (queryParams.length > 0) {
      const paramNames = queryParams.map(p => p.name);
      config.push(`params: { ${paramNames.join(', ')} }`);
    }

    // 处理请求体
    const bodyParams = parameters.filter(p => p.in === 'body');
    if (bodyParams.length > 0 && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      const paramNames = bodyParams.map(p => p.name);
      config.push(`data: { ${paramNames.join(', ')} }`);
    }

    // 处理请求头
    const headerParams = parameters.filter(p => p.in === 'header');
    if (headerParams.length > 0) {
      const headers = headerParams.map(p => `'${p.name}': ${p.name}`).join(', ');
      config.push(`headers: { ${headers} }`);
    }

    return config.join(',\n    ');
  }

  /**
   * 生成方法注释
   * @param {Object} api - API信息
   * @param {string} type - 类型 (api|logic)
   * @returns {string} 注释
   */
  generateMethodComments(api, type = 'api') {
    const { summary, description, parameters = [] } = api;
    const comments = ['/**'];
    
    if (summary) {
      comments.push(` * ${summary}`);
    }
    
    if (description && description !== summary) {
      comments.push(` * ${description}`);
    }
    
    if (parameters.length > 0) {
      comments.push(' *');
      parameters.forEach(param => {
        const { name, type = 'any', description, required = false } = param;
        const optional = required ? '' : '?';
        comments.push(` * @param {${type}} ${name}${optional} - ${description || ''}`);
      });
    }
    
    comments.push(` * @returns {Promise<Object>} ${type === 'logic' ? '处理结果' : 'API响应'}`);
    comments.push(' */');
    
    return comments.join('\n');
  }

  /**
   * 处理API路径
   * @param {string} apiPath - API路径
   * @returns {string} 处理后的路径
   */
  processApiPath(apiPath) {
    // 将路径参数转换为模板字符串
    return apiPath.replace(/\{([^}]+)\}/g, '${$1}');
  }

  /**
   * 生成Mock返回
   * @param {Object} api - API信息
   * @returns {string} Mock代码
   */
  generateMockReturn(api) {
    return `// Mock模式 - 返回模拟数据
  return Promise.resolve({
    data: ${JSON.stringify(this.generateMockData(api), null, 4)},
    status: 200,
    statusText: 'OK'
  });`;
  }

  /**
   * 生成API调用
   * @returns {string} API调用代码
   */
  generateApiCall() {
    return `return await request(config);`;
  }

  /**
   * 生成Mock数据
   * @param {Object} api - API信息
   * @returns {Object} Mock数据
   */
  generateMockData(api) {
    const { responses = {} } = api;
    const successResponse = responses['200'] || responses['201'] || {};
    
    if (successResponse.example) {
      return successResponse.example;
    }
    
    // 生成基础Mock数据
    return {
      id: 1,
      message: 'Mock数据',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 映射到TypeScript类型
   * @param {string} type - 原始类型
   * @returns {string} TypeScript类型
   */
  mapToTypeScript(type) {
    const typeMap = {
      'string': 'string',
      'number': 'number',
      'integer': 'number',
      'boolean': 'boolean',
      'array': 'any[]',
      'object': 'any'
    };
    
    return typeMap[type] || 'any';
  }

  /**
   * 生成响应类型
   * @param {Object} responses - 响应定义
   * @returns {string} 响应类型
   */
  generateResponseType(responses) {
    const successResponse = responses['200'] || responses['201'] || {};
    
    if (successResponse.schema) {
      return this.schemaToTypeScript(successResponse.schema);
    }
    
    return '  data: any;\n  status: number;\n  statusText: string;';
  }

  /**
   * Schema转TypeScript
   * @param {Object} schema - Schema定义
   * @returns {string} TypeScript类型
   */
  schemaToTypeScript(schema) {
    // 简化实现，实际项目中需要更复杂的转换逻辑
    return '  data: any;\n  status: number;\n  statusText: string;';
  }

  /**
   * 生成API导入语句
   * @param {boolean} mockMode - Mock模式
   * @returns {string} 导入语句
   */
  generateApiImports(mockMode) {
    if (mockMode) {
      return `// Mock模式 - 无需导入请求库`;
    }
    
    return `import request from '../utils/request';`;
  }

  /**
   * 生成逻辑导入语句
   * @param {string} apiFileName - API文件名
   * @returns {string} 导入语句
   */
  generateLogicImports(apiFileName) {
    return `import * as api from '../api/${apiFileName}';`;
  }

  /**
   * 生成API导出语句
   * @param {string} pid - 项目ID
   * @param {string} cid - 模块ID
   * @param {Array} apis - API列表
   * @returns {string} 导出语句
   */
  generateApiExports(pid, cid, apis) {
    const exports = apis.map(api => {
      const methodName = this.namingGenerator.generateApiMethodName(pid, cid, api.path, api.method);
      return methodName;
    });
    
    return `\nexport {\n  ${exports.join(',\n  ')}\n};`;
  }

  /**
   * 生成逻辑导出语句
   * @param {string} pid - 项目ID
   * @param {string} cid - 模块ID
   * @param {Array} apis - API列表
   * @returns {string} 导出语句
   */
  generateLogicExports(pid, cid, apis) {
    const exports = apis.map(api => {
      const methodName = this.namingGenerator.generateLogicMethodName(pid, cid, api.path, api.method);
      return methodName;
    });
    
    return `\nexport {\n  ${exports.join(',\n  ')}\n};`;
  }

  /**
   * 确保目录存在
   * @param {string} outputDir - 输出目录
   */
  async ensureDirectories(outputDir) {
    const dirs = [
      path.join(outputDir, 'api'),
      path.join(outputDir, 'logic'),
      path.join(outputDir, 'types')
    ];
    
    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }
  }

  /**
   * 获取API模板
   * @returns {string} API模板
   */
  getApiTemplate() {
    return `/**
 * API接口文件 - 自动生成
 * 生成时间: ${new Date().toISOString()}
 */

{{imports}}

{{methods}}

{{exports}}`;
  }

  /**
   * 获取逻辑模板
   * @returns {string} 逻辑模板
   */
  getLogicTemplate() {
    return `/**
 * 逻辑处理文件 - 自动生成
 * 生成时间: ${new Date().toISOString()}
 */

{{imports}}

{{methods}}

{{exports}}`;
  }

  /**
   * 获取类型模板
   * @returns {string} 类型模板
   */
  getTypesTemplate() {
    return `/**
 * 类型定义文件 - 自动生成
 * 生成时间: ${new Date().toISOString()}
 */

{{types}}`;
  }
}

module.exports = CodeGenerator;