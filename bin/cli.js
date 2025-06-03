#!/usr/bin/env node

/**
 * 前端接口代码生成器 - CLI工具
 */

const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const { APICodeGenerator } = require('../src/index');

const program = new Command();

program
  .name('api-generator')
  .description('前端接口代码生成器')
  .version('1.0.0');

// 生成命令
program
  .command('generate')
  .description('生成API代码')
  .option('-c, --config <path>', '配置文件路径', './config/generator.config.js')
  .option('-a, --api-doc <path>', 'API文档路径')
  .option('-o, --output <path>', '输出目录')
  .option('--dry-run', '预览模式，不实际生成文件')
  .option('--force', '强制生成，忽略可信度检查')
  .option('--incremental', '增量更新模式')
  .option('--report', '生成差异报告')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 前端接口代码生成器'));
      
      // 检查API文档
      if (!options.apiDoc) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'apiDoc',
            message: '请输入API文档路径:',
            validate: (input) => {
              if (!input) return '请输入API文档路径';
              if (!fs.existsSync(input)) return '文件不存在';
              return true;
            }
          }
        ]);
        options.apiDoc = answers.apiDoc;
      }
      
      // 读取API文档
      const apiDoc = await fs.readJson(options.apiDoc);
      
      // 创建生成器实例
      const generator = new APICodeGenerator({
        configPath: options.config
      });
      
      // 生成差异报告
      if (options.report) {
        console.log(chalk.yellow('📋 生成差异报告...'));
        const report = await generator.generateDiffReport(apiDoc);
        console.log(report);
        return;
      }
      
      // 预览模式
      if (options.dryRun) {
        console.log(chalk.yellow('👀 预览模式 - 不会实际生成文件'));
      }
      
      // 生成代码
      const result = await generator.generate(apiDoc, options);
      
      console.log(chalk.green('✅ 生成完成!'));
      console.log(`📁 输出目录: ${result.outputDir}`);
      console.log(`📄 生成文件: ${result.files.length} 个`);
      
    } catch (error) {
      console.error(chalk.red('❌ 生成失败:'), error.message);
      process.exit(1);
    }
  });

// Mock服务器命令
program
  .command('mock')
  .description('启动Mock服务器')
  .option('-p, --port <number>', '端口号', '3001')
  .option('-c, --config <path>', '配置文件路径', './config/generator.config.js')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🎭 启动Mock服务器...'));
      
      const generator = new APICodeGenerator({
        configPath: options.config
      });
      
      await generator.startMockServer({
        port: parseInt(options.port)
      });
      
    } catch (error) {
      console.error(chalk.red('❌ 启动失败:'), error.message);
      process.exit(1);
    }
  });

// 可信度检查命令
program
  .command('trust-check')
  .description('检查API文档可信度')
  .option('-a, --api-doc <path>', 'API文档路径')
  .option('-c, --config <path>', '配置文件路径', './config/generator.config.js')
  .action(async (options) => {
    try {
      if (!options.apiDoc) {
        console.error(chalk.red('❌ 请指定API文档路径'));
        process.exit(1);
      }
      
      const apiDoc = await fs.readJson(options.apiDoc);
      const generator = new APICodeGenerator({
        configPath: options.config
      });
      
      const trustScore = await generator.checkTrust(apiDoc);
      
      console.log(chalk.blue('📊 API文档可信度评估结果:'));
      console.log(`一致性: ${(trustScore.consistency * 100).toFixed(1)}%`);
      console.log(`完整性: ${(trustScore.completeness * 100).toFixed(1)}%`);
      console.log(`稳定性: ${(trustScore.stability * 100).toFixed(1)}%`);
      console.log(`总体评分: ${(trustScore.overall * 100).toFixed(1)}%`);
      
      if (trustScore.overall >= 0.8) {
        console.log(chalk.green('✅ 可信度高，建议使用'));
      } else if (trustScore.overall >= 0.6) {
        console.log(chalk.yellow('⚠️  可信度中等，建议谨慎使用'));
      } else {
        console.log(chalk.red('❌ 可信度低，不建议使用'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ 检查失败:'), error.message);
      process.exit(1);
    }
  });

// 差异检查命令
program
  .command('diff-check')
  .description('检查Mock数据与API文档的差异')
  .option('-a, --api-doc <path>', 'API文档路径')
  .option('-m, --mock <path>', 'Mock数据目录', './mock/data')
  .option('-c, --config <path>', '配置文件路径', './config/generator.config.js')
  .action(async (options) => {
    try {
      if (!options.apiDoc) {
        console.error(chalk.red('❌ 请指定API文档路径'));
        process.exit(1);
      }
      
      const apiDoc = await fs.readJson(options.apiDoc);
      const generator = new APICodeGenerator({
        configPath: options.config
      });
      
      const differences = await generator.checkDifferences(apiDoc);
      
      console.log(chalk.blue('🔍 Mock数据差异检测结果:'));
      console.log(`结构差异: ${differences.structural.length} 个`);
      console.log(`类型冲突: ${differences.typeConflicts.length} 个`);
      console.log(`缺失字段: ${differences.missingFields.length} 个`);
      console.log(`多余字段: ${differences.extraFields.length} 个`);
      console.log(`严重程度: ${differences.severity}`);
      
      if (differences.severity === 'low') {
        console.log(chalk.green('✅ 差异较小，可以安全更新'));
      } else if (differences.severity === 'medium') {
        console.log(chalk.yellow('⚠️  差异中等，建议人工确认'));
      } else {
        console.log(chalk.red('❌ 差异较大，建议暂停更新'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ 检查失败:'), error.message);
      process.exit(1);
    }
  });

// 初始化命令
program
  .command('init')
  .description('初始化项目配置')
  .action(async () => {
    try {
      console.log(chalk.blue('🔧 初始化项目配置...'));
      
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectId',
          message: '项目ID (pid):',
          default: 'p001'
        },
        {
          type: 'input',
          name: 'projectName',
          message: '项目名称:',
          default: 'MyProject'
        },
        {
          type: 'list',
          name: 'framework',
          message: '选择前端框架:',
          choices: ['react', 'vue', 'angular', 'vanilla']
        },
        {
          type: 'list',
          name: 'language',
          message: '选择语言:',
          choices: ['typescript', 'javascript']
        },
        {
          type: 'confirm',
          name: 'mockEnabled',
          message: '启用Mock功能?',
          default: true
        }
      ]);
      
      // 创建配置文件
      const config = {
        project: {
          pid: answers.projectId,
          name: answers.projectName
        },
        output: {
          apiDir: './output/api',
          logicDir: './output/logic',
          typesDir: './output/types'
        },
        templates: {
          framework: answers.framework,
          language: answers.language,
          style: 'async-await'
        },
        mock: {
          enabled: answers.mockEnabled,
          port: 3001,
          dataDir: './mock/data'
        },
        codeProtection: {
          enabled: true,
          backupBeforeUpdate: true,
          preserveCustomCode: true,
          trustThreshold: 0.6
        }
      };
      
      await fs.ensureDir('./config');
      await fs.writeJson('./config/generator.config.js', config, { spaces: 2 });
      
      console.log(chalk.green('✅ 配置文件创建完成!'));
      console.log(`📁 配置文件: ./config/generator.config.js`);
      
    } catch (error) {
      console.error(chalk.red('❌ 初始化失败:'), error.message);
      process.exit(1);
    }
  });

program.parse();