/**
 * 配置管理器 - 负责管理项目配置
 * @author Your Name
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const Ajv = require('ajv');
const yaml = require('yaml');

class ConfigManager {
  constructor(configPath = null) {
    this.configPath = configPath;
    this.config = {};
    this.schema = this.getConfigSchema();
    this.ajv = new Ajv({ allErrors: true });
    this.validator = this.ajv.compile(this.schema);
    
    // 加载配置
    this.loadConfig();
  }

  /**
   * 获取配置Schema定义
   */
  getConfigSchema() {
    return {
      type: 'object',
      properties: {
        project: {
          type: 'object',
          properties: {
            pid: { type: 'string', pattern: '^[a-zA-Z0-9]+$' },
            name: { type: 'string', minLength: 1 },
            version: { type: 'string', default: '1.0.0' },
            description: { type: 'string', default: '' }
          },
          required: ['pid', 'name']
        },
        output: {
          type: 'object',
          properties: {
            apiDir: { type: 'string', default: './output/api' },
            logicDir: { type: 'string', default: './output/logic' },
            typesDir: { type: 'string', default: './output/types' },
            mockDir: { type: 'string', default: './mock' }
          }
        },
        templates: {
          type: 'object',
          properties: {
            framework: {
              type: 'string',
              enum: ['react', 'vue', 'angular', 'vanilla'],
              default: 'react'
            },
            language: {
              type: 'string',
              enum: ['javascript', 'typescript'],
              default: 'typescript'
            },
            style: {
              type: 'string',
              enum: ['promise', 'async-await', 'callback'],
              default: 'async-await'
            },
            customTemplatesDir: { type: 'string', default: './templates' }
          }
        },
        mock: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', default: true },
            mode: {
              type: 'string',
              enum: ['manual', 'auto', 'hybrid'],
              default: 'hybrid'
            },
            port: { type: 'number', default: 3001 },
            dataDir: { type: 'string', default: './mock/data' },
            manualDataPath: { type: 'string', default: './mock/manual-data' },
            autoDataPath: { type: 'string', default: './mock/auto-data' },
            priority: {
              type: 'string',
              enum: ['manual', 'auto'],
              default: 'manual'
            },
            diffDetection: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean', default: true },
                warningThreshold: { type: 'number', default: 0.3 },
                blockingThreshold: { type: 'number', default: 0.7 }
              }
            }
          }
        },
        codeProtection: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', default: true },
            backupBeforeUpdate: { type: 'boolean', default: true },
            preserveCustomCode: { type: 'boolean', default: true },
            trustThreshold: { type: 'number', default: 0.6 },
            backupDir: { type: 'string', default: './backups' }
          }
        },
        naming: {
          type: 'object',
          properties: {
            fileNaming: {
              type: 'object',
              properties: {
                apiFile: { type: 'string', default: '{pid}-{cid}-api' },
                logicFile: { type: 'string', default: '{pid}-{cid}-logic' },
                typeFile: { type: 'string', default: '{pid}-{cid}-types' }
              }
            },
            methodNaming: {
              type: 'object',
              properties: {
                apiMethod: { type: 'string', default: '{pid}{cid}Api{path}' },
                logicMethod: { type: 'string', default: '{pid}{cid}{shortName}' }
              }
            },
            casing: {
              type: 'object',
              properties: {
                fileName: {
                  type: 'string',
                  enum: ['kebab-case', 'camelCase', 'PascalCase', 'snake_case'],
                  default: 'kebab-case'
                },
                methodName: {
                  type: 'string',
                  enum: ['camelCase', 'PascalCase'],
                  default: 'camelCase'
                }
              }
            }
          }
        },
        updateStrategy: {
          type: 'object',
          properties: {
            autoUpdate: { type: 'boolean', default: false },
            requireConfirmation: { type: 'boolean', default: true },
            generateDiffReport: { type: 'boolean', default: true },
            incrementalUpdate: { type: 'boolean', default: true }
          }
        },
        logging: {
          type: 'object',
          properties: {
            level: {
              type: 'string',
              enum: ['debug', 'info', 'warn', 'error'],
              default: 'info'
            },
            outputFile: { type: 'string', default: './logs/generator.log' },
            enableConsole: { type: 'boolean', default: true }
          }
        }
      },
      required: ['project']
    };
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig() {
    return {
      project: {
        pid: 'p001',
        name: 'DefaultProject',
        version: '1.0.0',
        description: '默认项目配置'
      },
      output: {
        apiDir: './output/api',
        logicDir: './output/logic',
        typesDir: './output/types',
        mockDir: './mock'
      },
      templates: {
        framework: 'react',
        language: 'typescript',
        style: 'async-await',
        customTemplatesDir: './templates'
      },
      mock: {
        enabled: true,
        mode: 'hybrid',
        port: 3001,
        dataDir: './mock/data',
        manualDataPath: './mock/manual-data',
        autoDataPath: './mock/auto-data',
        priority: 'manual',
        diffDetection: {
          enabled: true,
          warningThreshold: 0.3,
          blockingThreshold: 0.7
        }
      },
      codeProtection: {
        enabled: true,
        backupBeforeUpdate: true,
        preserveCustomCode: true,
        trustThreshold: 0.6,
        backupDir: './backups'
      },
      naming: {
        fileNaming: {
          apiFile: '{pid}-{cid}-api',
          logicFile: '{pid}-{cid}-logic',
          typeFile: '{pid}-{cid}-types'
        },
        methodNaming: {
          apiMethod: '{pid}{cid}Api{path}',
          logicMethod: '{pid}{cid}{shortName}'
        },
        casing: {
          fileName: 'kebab-case',
          methodName: 'camelCase'
        }
      },
      updateStrategy: {
        autoUpdate: false,
        requireConfirmation: true,
        generateDiffReport: true,
        incrementalUpdate: true
      },
      logging: {
        level: 'info',
        outputFile: './logs/generator.log',
        enableConsole: true
      }
    };
  }

  /**
   * 加载配置文件
   */
  async loadConfig() {
    try {
      // 获取默认配置
      this.config = this.getDefaultConfig();
      
      // 如果指定了配置文件路径，则加载
      if (this.configPath && await fs.pathExists(this.configPath)) {
        const userConfig = await this.loadConfigFile(this.configPath);
        this.config = this.mergeConfig(this.config, userConfig);
      } else {
        // 尝试加载默认配置文件
        const defaultPaths = [
          './config/generator.config.js',
          './config/generator.config.json',
          './config/generator.config.yaml',
          './generator.config.js',
          './generator.config.json'
        ];
        
        for (const configPath of defaultPaths) {
          if (await fs.pathExists(configPath)) {
            const userConfig = await this.loadConfigFile(configPath);
            this.config = this.mergeConfig(this.config, userConfig);
            this.configPath = configPath;
            break;
          }
        }
      }
      
      // 验证配置
      this.validateConfig();
      
      // 确保输出目录存在
      await this.ensureDirectories();
      
    } catch (error) {
      throw new Error(`配置加载失败: ${error.message}`);
    }
  }

  /**
   * 加载配置文件
   * @param {string} filePath - 配置文件路径
   */
  async loadConfigFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    try {
      switch (ext) {
        case '.js':
          // 清除require缓存
          delete require.cache[require.resolve(path.resolve(filePath))];
          return require(path.resolve(filePath));
          
        case '.json':
          return await fs.readJson(filePath);
          
        case '.yaml':
        case '.yml':
          const yamlContent = await fs.readFile(filePath, 'utf8');
          return yaml.parse(yamlContent);
          
        default:
          throw new Error(`不支持的配置文件格式: ${ext}`);
      }
    } catch (error) {
      throw new Error(`读取配置文件失败 ${filePath}: ${error.message}`);
    }
  }

  /**
   * 合并配置
   * @param {Object} defaultConfig - 默认配置
   * @param {Object} userConfig - 用户配置
   */
  mergeConfig(defaultConfig, userConfig) {
    return _.mergeWith(defaultConfig, userConfig, (objValue, srcValue) => {
      // 对于数组，使用源值替换而不是合并
      if (_.isArray(objValue)) {
        return srcValue;
      }
    });
  }

  /**
   * 验证配置
   */
  validateConfig() {
    const valid = this.validator(this.config);
    
    if (!valid) {
      const errors = this.validator.errors.map(error => {
        return `${error.instancePath}: ${error.message}`;
      }).join(', ');
      
      throw new Error(`配置验证失败: ${errors}`);
    }
  }

  /**
   * 确保必要的目录存在
   */
  async ensureDirectories() {
    const directories = [
      this.config.output.apiDir,
      this.config.output.logicDir,
      this.config.output.typesDir,
      this.config.mock.dataDir,
      this.config.mock.manualDataPath,
      this.config.mock.autoDataPath,
      this.config.codeProtection.backupDir,
      path.dirname(this.config.logging.outputFile)
    ];
    
    for (const dir of directories) {
      await fs.ensureDir(dir);
    }
  }

  /**
   * 获取配置值
   * @param {string} keyPath - 配置键路径，如 'project.pid'
   * @param {*} defaultValue - 默认值
   */
  get(keyPath, defaultValue = undefined) {
    return _.get(this.config, keyPath, defaultValue);
  }

  /**
   * 设置配置值
   * @param {string} keyPath - 配置键路径
   * @param {*} value - 配置值
   */
  set(keyPath, value) {
    _.set(this.config, keyPath, value);
  }

  /**
   * 检查配置键是否存在
   * @param {string} keyPath - 配置键路径
   */
  has(keyPath) {
    return _.has(this.config, keyPath);
  }

  /**
   * 获取完整配置
   */
  getAll() {
    return _.cloneDeep(this.config);
  }

  /**
   * 保存配置到文件
   * @param {string} filePath - 保存路径，可选
   */
  async save(filePath = null) {
    const targetPath = filePath || this.configPath || './config/generator.config.js';
    const ext = path.extname(targetPath).toLowerCase();
    
    try {
      await fs.ensureDir(path.dirname(targetPath));
      
      switch (ext) {
        case '.js':
          const jsContent = `module.exports = ${JSON.stringify(this.config, null, 2)};`;
          await fs.writeFile(targetPath, jsContent);
          break;
          
        case '.json':
          await fs.writeJson(targetPath, this.config, { spaces: 2 });
          break;
          
        case '.yaml':
        case '.yml':
          const yamlContent = yaml.stringify(this.config);
          await fs.writeFile(targetPath, yamlContent);
          break;
          
        default:
          throw new Error(`不支持的保存格式: ${ext}`);
      }
      
      this.configPath = targetPath;
      
    } catch (error) {
      throw new Error(`保存配置失败: ${error.message}`);
    }
  }

  /**
   * 重新加载配置
   */
  async reload() {
    await this.loadConfig();
  }

  /**
   * 获取环境特定的配置
   * @param {string} env - 环境名称
   */
  getEnvConfig(env = 'development') {
    const envConfig = this.get(`environments.${env}`, {});
    return this.mergeConfig(this.config, envConfig);
  }

  /**
   * 验证项目配置
   */
  validateProject() {
    const pid = this.get('project.pid');
    const name = this.get('project.name');
    
    if (!pid || !name) {
      throw new Error('项目配置不完整，缺少 pid 或 name');
    }
    
    // 验证pid格式
    if (!/^[a-zA-Z0-9]+$/.test(pid)) {
      throw new Error('项目ID(pid)只能包含字母和数字');
    }
    
    return true;
  }

  /**
   * 获取配置摘要信息
   */
  getSummary() {
    return {
      project: {
        pid: this.get('project.pid'),
        name: this.get('project.name'),
        version: this.get('project.version')
      },
      framework: this.get('templates.framework'),
      language: this.get('templates.language'),
      mockEnabled: this.get('mock.enabled'),
      protectionEnabled: this.get('codeProtection.enabled'),
      configPath: this.configPath
    };
  }

  /**
   * 创建配置备份
   */
  async backup() {
    if (!this.configPath) {
      throw new Error('没有配置文件路径，无法备份');
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${this.configPath}.backup.${timestamp}`;
    
    await fs.copy(this.configPath, backupPath);
    return backupPath;
  }

  /**
   * 从备份恢复配置
   * @param {string} backupPath - 备份文件路径
   */
  async restore(backupPath) {
    if (!await fs.pathExists(backupPath)) {
      throw new Error(`备份文件不存在: ${backupPath}`);
    }
    
    if (!this.configPath) {
      throw new Error('没有配置文件路径，无法恢复');
    }
    
    await fs.copy(backupPath, this.configPath);
    await this.reload();
  }
}

module.exports = ConfigManager;