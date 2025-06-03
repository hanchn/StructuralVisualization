const JsonParser = require('./parser/json-parser');
const CodeGenerator = require('./generator/code-generator');
const fs = require('fs-extra');
const path = require('path');

class ApiCodeGenerator {
  constructor(options = {}) {
    this.outputDir = options.outputDir || './output';
    this.parser = new JsonParser();
    this.generator = new CodeGenerator();
  }

  /**
   * 生成代码的主方法
   * @param {Object} apiData - API数据
   * @param {string} outputPath - 输出路径（可选）
   * @returns {Object} 生成结果
   */
  async generateCode(apiData, outputPath = null) {
    try {
      // 1. 解析JSON数据
      const parsedData = this.parser.parse(apiData);
      
      // 2. 生成代码
      const generatedCode = this.generator.generate(parsedData);
      
      // 3. 写入文件（如果指定了输出路径）
      if (outputPath) {
        await this.writeFiles(generatedCode, outputPath);
      }
      
      return {
        success: true,
        data: generatedCode,
        message: 'Code generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate code'
      };
    }
  }

  /**
   * 写入生成的代码到文件
   */
  async writeFiles(generatedCode, outputPath) {
    const { apiCode, logicCode, fileName } = generatedCode;
    
    // 确保输出目录存在
    await fs.ensureDir(outputPath);
    
    // 写入API文件
    const apiFilePath = path.join(outputPath, `${fileName}-api.js`);
    await fs.writeFile(apiFilePath, apiCode, 'utf8');
    
    // 写入逻辑文件
    const logicFilePath = path.join(outputPath, `${fileName}-logic.js`);
    await fs.writeFile(logicFilePath, logicCode, 'utf8');
    
    console.log(`✅ Generated files:`);
    console.log(`   📄 ${apiFilePath}`);
    console.log(`   📄 ${logicFilePath}`);
  }

  /**
   * 从文件读取JSON数据并生成代码
   */
  async generateFromFile(inputFile, outputPath = null) {
    try {
      const jsonData = await fs.readJson(inputFile);
      return await this.generateCode(jsonData, outputPath);
    } catch (error) {
      throw new Error(`Failed to read input file: ${error.message}`);
    }
  }
}

// 导出类和便捷方法
module.exports = ApiCodeGenerator;

// 便捷方法
module.exports.generateCode = async (apiData, outputPath = null) => {
  const generator = new ApiCodeGenerator();
  return await generator.generateCode(apiData, outputPath);
};

module.exports.generateFromFile = async (inputFile, outputPath = null) => {
  const generator = new ApiCodeGenerator();
  return await generator.generateFromFile(inputFile, outputPath);
};