/**
 * 配置验证工具
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');

class ConfigValidator {
  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
  }

  /**
   * 验证项目ID格式
   * @param {string} pid - 项目ID
   */
  validatePid(pid) {
    const pidRegex = /^[a-zA-Z][a-zA-Z0-9]*$/;
    
    if (!pid) {
      return { valid: false, error: '项目ID不能为空' };
    }
    
    if (!pidRegex.test(pid)) {
      return { 
        valid: false, 
        error: '项目ID必须以字母开头，只能包含字母和数字' 
      };
    }
    
    if (pid.length > 20) {
      return { 
        valid: false, 
        error: '项目ID长度不能超过20个字符' 
      };
    }
    
    return { valid: true };
  }

  /**
   * 验证端口号
   * @param {number} port - 端口号
   */
  validatePort(port) {
    if (!Number.isInteger(port)) {
      return { valid: false, error: '端口号必须是整数' };
    }
    
    if (port < 1024 || port > 65535) {
      return { 
        valid: false, 
        error: '端口号必须在1024-65535范围内' 
      };
    }
    
    return { valid: true };
  }

  /**
   * 验证目录路径
   * @param {string} dirPath - 目录路径
   */
  validateDirectory(dirPath) {
    if (!dirPath || typeof dirPath !== 'string') {
      return { valid: false, error: '目录路径不能为空' };
    }
    
    // 检查路径格式
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(dirPath)) {
      return { 
        valid: false, 
        error: '目录路径包含无效字符' 
      };
    }
    
    return { valid: true };
  }

  /**
   * 验证命名模板
   * @param {string} template - 命名模板
   */
  validateNamingTemplate(template) {
    if (!template || typeof template !== 'string') {
      return { valid: false, error: '命名模板不能为空' };
    }
    
    // 检查必要的占位符
    const requiredPlaceholders = ['{pid}'];
    const missingPlaceholders = requiredPlaceholders.filter(
      placeholder => !template.includes(placeholder)
    );
    
    if (missingPlaceholders.length > 0) {
      return {
        valid: false,
        error: `命名模板缺少必要的占位符: ${missingPlaceholders.join(', ')}`
      };
    }
    
    return { valid: true };
  }

  /**
   * 验证阈值
   * @param {number} threshold - 阈值
   * @param {string} name - 阈值名称
   */
  validateThreshold(threshold, name = '阈值') {
    if (typeof threshold !== 'number') {
      return { valid: false, error: `${name}必须是数字` };
    }
    
    if (threshold < 0 || threshold > 1) {
      return { 
        valid: false, 
        error: `${name}必须在0-1之间` 
      };
    }
    
    return { valid: true };
  }

  /**
   * 验证完整配置
   * @param {Object} config - 配置对象
   */
  validateFullConfig(config) {
    const errors = [];
    
    // 验证项目配置
    if (config.project) {
      const pidResult = this.validatePid(config.project.pid);
      if (!pidResult.valid) {
        errors.push(`project.pid: ${pidResult.error}`);
      }
    }
    
    // 验证Mock端口
    if (config.mock && config.mock.port) {
      const portResult = this.validatePort(config.mock.port);
      if (!portResult.valid) {
        errors.push(`mock.port: ${portResult.error}`);
      }
    }
    
    // 验证目录路径
    const directories = [
      'output.apiDir',
      'output.logicDir', 
      'output.typesDir',
      'mock.dataDir'
    ];
    
    directories.forEach(dirPath => {
      const value = this.getNestedValue(config, dirPath);
      if (value) {
        const dirResult = this.validateDirectory(value);
        if (!dirResult.valid) {
          errors.push(`${dirPath}: ${dirResult.error}`);
        }
      }
    });
    
    // 验证阈值
    const thresholds = [
      { path: 'mock.diffDetection.warningThreshold', name: '警告阈值' },
      { path: 'mock.diffDetection.blockingThreshold', name: '阻塞阈值' },
      { path: 'codeProtection.trustThreshold', name: '可信度阈值' }
    ];
    
    thresholds.forEach(({ path, name }) => {
      const value = this.getNestedValue(config, path);
      if (value !== undefined) {
        const thresholdResult = this.validateThreshold(value, name);
        if (!thresholdResult.valid) {
          errors.push(`${path}: ${thresholdResult.error}`);
        }
      }
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取嵌套对象的值
   * @param {Object} obj - 对象
   * @param {string} path - 路径
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
}

module.exports = ConfigValidator;