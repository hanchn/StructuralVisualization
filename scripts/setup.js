#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

// 创建项目目录结构
const directories = [
  'src/core',
  'src/utils',
  'src/templates',
  'src/generators',
  'bin',
  'config',
  'templates/api',
  'templates/logic',
  'templates/types',
  'templates/mock',
  'output/api',
  'output/logic',
  'output/types',
  'mock/data',
  'mock/manual-data',
  'mock/auto-data',
  'test/unit',
  'test/integration',
  'test/fixtures',
  'docs',
  'examples'
];

async function setupProject() {
  console.log('🚀 开始创建项目结构...');
  
  try {
    // 创建目录
    for (const dir of directories) {
      await fs.ensureDir(dir);
      console.log(`✅ 创建目录: ${dir}`);
    }
    
    // 创建基础文件
    const baseFiles = {
      'src/index.js': '',
      'bin/cli.js': '',
      'config/generator.config.js': '',
      'config/naming.config.js': '',
      'config/template.config.js': '',
      'config/mock.config.js': '',
      '.eslintrc.js': '',
      '.prettierrc': '',
      'jest.config.js': '',
      'CONTRIBUTING.md': '',
      'LICENSE': ''
    };
    
    for (const [file, content] of Object.entries(baseFiles)) {
      if (!await fs.pathExists(file)) {
        await fs.writeFile(file, content);
        console.log(`✅ 创建文件: ${file}`);
      }
    }
    
    console.log('🎉 项目结构创建完成！');
    
  } catch (error) {
    console.error('❌ 创建项目结构失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  setupProject();
}

module.exports = setupProject;