/**
 * 命名生成器 - 负责生成标准化的文件名和方法名
 * @author Your Name
 * @version 1.0.0
 */

const path = require('path');
const _ = require('lodash');

class NamingGenerator {
  constructor(config = {}) {
    this.config = {
      // 默认配置
      fileNaming: {
        separator: '-',
        extension: '.js'
      },
      methodNaming: {
        style: 'camelCase', // camelCase, PascalCase, snake_case
        prefix: 'api',
        logicPrefix: ''
      },
      pathMapping: {
        // 路径简化映射
        '/api/v1/': '',
        '/api/': '',
        '/v1/': ''
      },
      ...config
    };
  }

  /**
   * 生成API文件名
   * @param {string} pid - 项目ID
   * @param {string} cid - 模块ID
   * @returns {string} 文件名
   */
  generateApiFileName(pid, cid) {
    const { separator, extension } = this.config.fileNaming;
    return `${pid}${separator}${cid}${separator}api${extension}`;
  }

  /**
   * 生成逻辑文件名
   * @param {string} pid - 项目ID
   * @param {string} cid - 模块ID
   * @returns {string} 文件名
   */
  generateLogicFileName(pid, cid) {
    const { separator, extension } = this.config.fileNaming;
    return `${pid}${separator}${cid}${separator}logic${extension}`;
  }

  /**
   * 生成类型定义文件名
   * @param {string} pid - 项目ID
   * @param {string} cid - 模块ID
   * @returns {string} 文件名
   */
  generateTypesFileName(pid, cid) {
    const { separator } = this.config.fileNaming;
    return `${pid}${separator}${cid}${separator}types.d.ts`;
  }

  /**
   * 生成API方法名
   * @param {string} pid - 项目ID
   * @param {string} cid - 模块ID
   * @param {string} apiPath - 接口路径
   * @param {string} method - HTTP方法
   * @returns {string} 方法名
   */
  generateApiMethodName(pid, cid, apiPath, method = 'get') {
    const cleanPath = this.cleanApiPath(apiPath);
    const pathParts = this.parsePathToParts(cleanPath);
    const methodSuffix = method.toLowerCase() === 'get' ? '' : _.capitalize(method.toLowerCase());
    
    const baseName = `${pid}${_.capitalize(cid)}Api${pathParts}${methodSuffix}`;
    return this.formatMethodName(baseName);
  }

  /**
   * 生成逻辑方法名
   * @param {string} pid - 项目ID
   * @param {string} cid - 模块ID
   * @param {string} apiPath - 接口路径
   * @param {string} method - HTTP方法
   * @returns {string} 方法名
   */
  generateLogicMethodName(pid, cid, apiPath, method = 'get') {
    const cleanPath = this.cleanApiPath(apiPath);
    const pathParts = this.parsePathToParts(cleanPath);
    const methodSuffix = method.toLowerCase() === 'get' ? '' : _.capitalize(method.toLowerCase());
    
    const baseName = `${pid}${_.capitalize(cid)}${pathParts}${methodSuffix}`;
    return this.formatMethodName(baseName);
  }

  /**
   * 清理API路径
   * @param {string} apiPath - 原始API路径
   * @returns {string} 清理后的路径
   */
  cleanApiPath(apiPath) {
    let cleanPath = apiPath;
    
    // 应用路径映射
    Object.entries(this.config.pathMapping).forEach(([pattern, replacement]) => {
      cleanPath = cleanPath.replace(new RegExp(pattern, 'g'), replacement);
    });
    
    // 移除开头和结尾的斜杠
    cleanPath = cleanPath.replace(/^\/+|\/+$/g, '');
    
    // 处理路径参数 {id} -> ById
    cleanPath = cleanPath.replace(/\{([^}]+)\}/g, (match, param) => {
      return `By${_.capitalize(_.camelCase(param))}`;
    });
    
    return cleanPath;
  }

  /**
   * 将路径转换为方法名部分
   * @param {string} cleanPath - 清理后的路径
   * @returns {string} 方法名部分
   */
  parsePathToParts(cleanPath) {
    if (!cleanPath) return '';
    
    return cleanPath
      .split('/')
      .filter(part => part.length > 0)
      .map(part => {
        // 处理连字符和下划线
        return _.capitalize(_.camelCase(part));
      })
      .join('');
  }

  /**
   * 格式化方法名
   * @param {string} methodName - 原始方法名
   * @returns {string} 格式化后的方法名
   */
  formatMethodName(methodName) {
    const { style } = this.config.methodNaming;
    
    switch (style) {
      case 'PascalCase':
        return _.upperFirst(_.camelCase(methodName));
      case 'snake_case':
        return _.snakeCase(methodName);
      case 'camelCase':
      default:
        return _.camelCase(methodName);
    }
  }

  /**
   * 生成完整的文件路径
   * @param {string} baseDir - 基础目录
   * @param {string} fileName - 文件名
   * @returns {string} 完整路径
   */
  generateFilePath(baseDir, fileName) {
    return path.join(baseDir, fileName);
  }

  /**
   * 生成导入语句
   * @param {string} fromPath - 源文件路径
   * @param {string} toPath - 目标文件路径
   * @param {string} exportName - 导出名称
   * @returns {string} 导入语句
   */
  generateImportStatement(fromPath, toPath, exportName) {
    const relativePath = path.relative(path.dirname(fromPath), toPath)
      .replace(/\\/g, '/')
      .replace(/\.js$/, '');
    
    const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
    
    return `import { ${exportName} } from '${importPath}';`;
  }

  /**
   * 验证命名规范
   * @param {string} name - 待验证的名称
   * @param {string} type - 类型 (file|method|variable)
   * @returns {Object} 验证结果
   */
  validateNaming(name, type = 'method') {
    const rules = {
      file: {
        pattern: /^[a-z0-9-]+\.(js|ts|d\.ts)$/,
        message: '文件名应为小写字母、数字和连字符组合'
      },
      method: {
        pattern: /^[a-zA-Z][a-zA-Z0-9]*$/,
        message: '方法名应为驼峰命名法'
      },
      variable: {
        pattern: /^[a-zA-Z_$][a-zA-Z0-9_$]*$/,
        message: '变量名应符合JavaScript命名规范'
      }
    };
    
    const rule = rules[type];
    if (!rule) {
      return { valid: false, error: '未知的命名类型' };
    }
    
    const valid = rule.pattern.test(name);
    return {
      valid,
      error: valid ? null : rule.message
    };
  }

  /**
   * 生成命名摘要
   * @param {string} pid - 项目ID
   * @param {string} cid - 模块ID
   * @param {Array} apis - API列表
   * @returns {Object} 命名摘要
   */
  generateNamingSummary(pid, cid, apis = []) {
    const summary = {
      files: {
        api: this.generateApiFileName(pid, cid),
        logic: this.generateLogicFileName(pid, cid),
        types: this.generateTypesFileName(pid, cid)
      },
      methods: {
        api: [],
        logic: []
      },
      conflicts: [],
      statistics: {
        totalMethods: 0,
        uniqueNames: 0
      }
    };
    
    const methodNames = new Set();
    
    apis.forEach(api => {
      const apiMethodName = this.generateApiMethodName(pid, cid, api.path, api.method);
      const logicMethodName = this.generateLogicMethodName(pid, cid, api.path, api.method);
      
      summary.methods.api.push({
        path: api.path,
        method: api.method,
        name: apiMethodName
      });
      
      summary.methods.logic.push({
        path: api.path,
        method: api.method,
        name: logicMethodName
      });
      
      // 检查命名冲突
      if (methodNames.has(apiMethodName)) {
        summary.conflicts.push({
          type: 'api',
          name: apiMethodName,
          path: api.path
        });
      }
      
      if (methodNames.has(logicMethodName)) {
        summary.conflicts.push({
          type: 'logic',
          name: logicMethodName,
          path: api.path
        });
      }
      
      methodNames.add(apiMethodName);
      methodNames.add(logicMethodName);
    });
    
    summary.statistics.totalMethods = apis.length * 2; // API + Logic
    summary.statistics.uniqueNames = methodNames.size;
    
    return summary;
  }

  /**
   * 获取配置信息
   * @returns {Object} 当前配置
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * 更新配置
   * @param {Object} newConfig - 新配置
   */
  updateConfig(newConfig) {
    this.config = _.merge(this.config, newConfig);
  }
}

module.exports = NamingGenerator;