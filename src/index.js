/**
 * 前端接口代码生成器 - 主入口
 * @author Your Name
 * @version 1.0.0
 */

const CodeGenerator = require('./core/code-generator');
const MockGenerator = require('./core/mock-generator');
const ASTAnalyzer = require('./core/ast-analyzer');
const NamingGenerator = require('./core/naming-generator');
const ConfigManager = require('./core/config-manager');
const TrustEvaluator = require('./core/trust-evaluator');
const DiffDetector = require('./core/diff-detector');
const CodeProtector = require('./core/code-protector');

class APICodeGenerator {
  constructor(options = {}) {
    this.config = new ConfigManager(options.configPath);
    this.codeGenerator = new CodeGenerator(this.config);
    this.mockGenerator = new MockGenerator(this.config);
    this.astAnalyzer = new ASTAnalyzer(this.config);
    this.namingGenerator = new NamingGenerator(this.config);
    this.trustEvaluator = new TrustEvaluator(this.config);
    this.diffDetector = new DiffDetector(this.config);
    this.codeProtector = new CodeProtector(this.config);
  }

  /**
   * 生成API代码
   * @param {Object} apiDoc - API文档
   * @param {Object} options - 生成选项
   */
  async generate(apiDoc, options = {}) {
    try {
      console.log('🚀 开始生成API代码...');
      
      // 1. 评估API文档可信度
      const trustScore = await this.trustEvaluator.evaluateAPITrust(apiDoc);
      console.log(`📊 API文档可信度: ${(trustScore.overall * 100).toFixed(1)}%`);
      
      if (trustScore.overall < this.config.get('codeProtection.trustThreshold', 0.6)) {
        console.warn('⚠️  API文档可信度较低，建议人工审核');
        if (!options.force) {
          throw new Error('API文档可信度不足，使用 --force 参数强制生成');
        }
      }
      
      // 2. 检测现有代码
      const existingCode = await this.astAnalyzer.analyzeExistingCode();
      
      // 3. 检测Mock差异
      const mockDifferences = await this.diffDetector.detectMockDifferences(apiDoc);
      
      // 4. 确定更新策略
      const updateStrategy = this.codeProtector.determineUpdateStrategy({
        apiDoc,
        trustScore,
        existingCode,
        mockDifferences
      });
      
      console.log(`📋 更新策略: ${updateStrategy.strategy}`);
      
      // 5. 生成代码
      const result = await this.codeGenerator.generate(apiDoc, {
        ...options,
        updateStrategy,
        existingCode
      });
      
      // 6. 生成Mock数据（如果启用）
      if (this.config.get('mock.enabled', true)) {
        await this.mockGenerator.generate(apiDoc, options);
      }
      
      console.log('✅ API代码生成完成！');
      return result;
      
    } catch (error) {
      console.error('❌ 生成失败:', error.message);
      throw error;
    }
  }

  /**
   * 启动Mock服务器
   * @param {Object} options - 服务器选项
   */
  async startMockServer(options = {}) {
    return this.mockGenerator.startServer(options);
  }

  /**
   * 检查API文档可信度
   * @param {Object} apiDoc - API文档
   */
  async checkTrust(apiDoc) {
    return this.trustEvaluator.evaluateAPITrust(apiDoc);
  }

  /**
   * 检测Mock差异
   * @param {Object} apiDoc - API文档
   */
  async checkDifferences(apiDoc) {
    return this.diffDetector.detectMockDifferences(apiDoc);
  }

  /**
   * 生成差异报告
   * @param {Object} apiDoc - API文档
   */
  async generateDiffReport(apiDoc) {
    const differences = await this.checkDifferences(apiDoc);
    return this.diffDetector.generateReport(differences);
  }
}

module.exports = {
  APICodeGenerator,
  CodeGenerator,
  MockGenerator,
  ASTAnalyzer,
  NamingGenerator,
  ConfigManager,
  TrustEvaluator,
  DiffDetector,
  CodeProtector
};