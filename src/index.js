/**
 * API代码生成器主入口
 */
import { APIParser } from './core/parser.js';
import { CodeGenerator } from './core/generator.js';
import { DataMapper } from './core/data-mapper.js';

export class APICodeGenerator {
  constructor(options = {}) {
    this.parser = new APIParser();
    this.generator = new CodeGenerator(options);
  }

  /**
   * 从API文档生成前端代码
   * @param {Object} apiDoc - API文档
   * @param {string} format - 文档格式
   * @returns {string} 生成的代码
   */
  generate(apiDoc, format = 'swagger') {
    // 1. 解析API文档为AST
    const ast = this.parser.parse(apiDoc, format);
    
    // 2. 从AST生成代码
    const code = this.generator.generate(ast);
    
    return code;
  }

  /**
   * 设置生成选项
   */
  setOptions(options) {
    this.generator.options = { ...this.generator.options, ...options };
  }
  
  /**
   * 生成多平台代码
   */
  generateForPlatform(apiDoc, platform = 'web', options = {}) {
    const ast = this.parser.parse(apiDoc);
    
    // 加载平台配置
    const platformConfig = this.loadPlatformConfig(platform);
    
    // 创建数据映射器
    const mapper = new DataMapper({ platform: platformConfig.responseMapping });
    
    // 配置生成器
    const generator = new CodeGenerator({
      ...platformConfig,
      ...options,
      dataMapper: mapper
    });
    
    return generator.generate(ast);
  }
  
  loadPlatformConfig(platform) {
    // 加载平台配置逻辑
    const configs = require('../config/platforms.json');
    return configs.platforms[platform] || configs.platforms.web;
  }
}

// 默认导出
export default APICodeGenerator;

// 便捷方法
export function generateAPICode(apiDoc, options = {}) {
  const generator = new APICodeGenerator(options);
  return generator.generate(apiDoc, options.format || 'swagger');
}