const fs = require('fs-extra');
const path = require('path');

class FileUtils {
  /**
   * 确保目录存在
   */
  static async ensureDir(dirPath) {
    await fs.ensureDir(dirPath);
  }

  /**
   * 写入文件
   */
  static async writeFile(filePath, content) {
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`✅ Generated: ${filePath}`);
  }

  /**
   * 读取JSON文件
   */
  static async readJson(filePath) {
    return await fs.readJson(filePath);
  }

  /**
   * 检查文件是否存在
   */
  static async exists(filePath) {
    return await fs.pathExists(filePath);
  }

  /**
   * 创建完整的输出目录结构
   */
  static async createOutputStructure(outputDir) {
    const dirs = [
      path.join(outputDir, 'api'),
      path.join(outputDir, 'logic'),
      path.join(outputDir, 'types')
    ];
    
    for (const dir of dirs) {
      await this.ensureDir(dir);
    }
    
    return {
      apiDir: dirs[0],
      logicDir: dirs[1],
      typesDir: dirs[2]
    };
  }
}

module.exports = FileUtils;