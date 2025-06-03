/**
 * AST分析器 - 负责代码结构分析和增量更新
 * @author Your Name
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');
const crypto = require('crypto');

class ASTAnalyzer {
  constructor(config = {}) {
    this.config = {
      // 解析选项
      parserOptions: {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties',
          'asyncGenerators',
          'functionBind',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'dynamicImport',
          'nullishCoalescingOperator',
          'optionalChaining'
        ]
      },
      // 生成选项
      generatorOptions: {
        retainLines: false,
        compact: false,
        minified: false,
        comments: true
      },
      // 增量更新选项
      incrementalOptions: {
        preserveComments: true,
        preserveFormatting: true,
        conflictResolution: 'rename', // rename, overwrite, skip
        hashAlgorithm: 'md5'
      },
      ...config
    };
  }

  /**
   * 分析文件结构
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeFile(filePath) {
    try {
      if (!await fs.pathExists(filePath)) {
        return {
          exists: false,
          structure: null,
          hash: null,
          error: '文件不存在'
        };
      }

      const content = await fs.readFile(filePath, 'utf8');
      const hash = this.generateHash(content);
      const ast = this.parseCode(content);
      const structure = this.extractStructure(ast);

      return {
        exists: true,
        filePath,
        content,
        hash,
        ast,
        structure,
        error: null
      };
    } catch (error) {
      return {
        exists: true,
        filePath,
        structure: null,
        hash: null,
        error: error.message
      };
    }
  }

  /**
   * 解析代码为AST
   * @param {string} code - 源代码
   * @returns {Object} AST对象
   */
  parseCode(code) {
    return parse(code, this.config.parserOptions);
  }

  /**
   * 提取代码结构
   * @param {Object} ast - AST对象
   * @returns {Object} 代码结构
   */
  extractStructure(ast) {
    const structure = {
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      variables: [],
      comments: [],
      metadata: {
        totalLines: 0,
        totalFunctions: 0,
        totalExports: 0
      }
    };

    traverse(ast, {
      // 导入语句
      ImportDeclaration(path) {
        structure.imports.push({
          type: 'import',
          source: path.node.source.value,
          specifiers: path.node.specifiers.map(spec => ({
            type: spec.type,
            local: spec.local.name,
            imported: spec.imported ? spec.imported.name : null
          })),
          start: path.node.start,
          end: path.node.end,
          hash: this.generateNodeHash(path.node)
        });
      },

      // 导出语句
      ExportNamedDeclaration(path) {
        const exportInfo = {
          type: 'export',
          declaration: null,
          specifiers: [],
          source: path.node.source ? path.node.source.value : null,
          start: path.node.start,
          end: path.node.end,
          hash: this.generateNodeHash(path.node)
        };

        if (path.node.declaration) {
          exportInfo.declaration = this.extractDeclaration(path.node.declaration);
        }

        if (path.node.specifiers) {
          exportInfo.specifiers = path.node.specifiers.map(spec => ({
            local: spec.local.name,
            exported: spec.exported.name
          }));
        }

        structure.exports.push(exportInfo);
      },

      // 默认导出
      ExportDefaultDeclaration(path) {
        structure.exports.push({
          type: 'export-default',
          declaration: this.extractDeclaration(path.node.declaration),
          start: path.node.start,
          end: path.node.end,
          hash: this.generateNodeHash(path.node)
        });
      },

      // 函数声明
      FunctionDeclaration(path) {
        structure.functions.push(this.extractFunction(path.node));
      },

      // 箭头函数
      ArrowFunctionExpression(path) {
        if (path.parent.type === 'VariableDeclarator') {
          structure.functions.push(this.extractFunction(path.node, path.parent.id.name));
        }
      },

      // 函数表达式
      FunctionExpression(path) {
        if (path.parent.type === 'VariableDeclarator') {
          structure.functions.push(this.extractFunction(path.node, path.parent.id.name));
        }
      },

      // 类声明
      ClassDeclaration(path) {
        structure.classes.push(this.extractClass(path.node));
      },

      // 变量声明
      VariableDeclaration(path) {
        path.node.declarations.forEach(declarator => {
          if (declarator.id.type === 'Identifier') {
            structure.variables.push({
              name: declarator.id.name,
              type: 'variable',
              kind: path.node.kind, // var, let, const
              hasInit: !!declarator.init,
              start: declarator.start,
              end: declarator.end,
              hash: this.generateNodeHash(declarator)
            });
          }
        });
      }
    });

    // 提取注释
    if (ast.comments) {
      structure.comments = ast.comments.map(comment => ({
        type: comment.type,
        value: comment.value,
        start: comment.start,
        end: comment.end
      }));
    }

    // 计算元数据
    structure.metadata.totalFunctions = structure.functions.length;
    structure.metadata.totalExports = structure.exports.length;
    structure.metadata.totalLines = ast.loc ? ast.loc.end.line : 0;

    return structure;
  }

  /**
   * 提取函数信息
   * @param {Object} node - 函数节点
   * @param {string} name - 函数名（用于箭头函数）
   * @returns {Object} 函数信息
   */
  extractFunction(node, name = null) {
    return {
      name: name || (node.id ? node.id.name : 'anonymous'),
      type: 'function',
      async: node.async || false,
      generator: node.generator || false,
      params: node.params.map(param => {
        if (param.type === 'Identifier') {
          return { name: param.name, type: 'simple' };
        } else if (param.type === 'AssignmentPattern') {
          return { 
            name: param.left.name, 
            type: 'default',
            defaultValue: generate(param.right).code
          };
        } else {
          return { name: 'complex', type: 'complex' };
        }
      }),
      start: node.start,
      end: node.end,
      hash: this.generateNodeHash(node)
    };
  }

  /**
   * 提取类信息
   * @param {Object} node - 类节点
   * @returns {Object} 类信息
   */
  extractClass(node) {
    return {
      name: node.id ? node.id.name : 'anonymous',
      type: 'class',
      superClass: node.superClass ? node.superClass.name : null,
      methods: node.body.body.filter(member => member.type === 'MethodDefinition').map(method => ({
        name: method.key.name,
        kind: method.kind, // constructor, method, get, set
        static: method.static,
        async: method.value.async,
        start: method.start,
        end: method.end
      })),
      start: node.start,
      end: node.end,
      hash: this.generateNodeHash(node)
    };
  }

  /**
   * 提取声明信息
   * @param {Object} node - 声明节点
   * @returns {Object} 声明信息
   */
  extractDeclaration(node) {
    if (!node) return null;

    switch (node.type) {
      case 'FunctionDeclaration':
        return this.extractFunction(node);
      case 'ClassDeclaration':
        return this.extractClass(node);
      case 'VariableDeclaration':
        return {
          type: 'variable',
          kind: node.kind,
          declarations: node.declarations.map(d => d.id.name)
        };
      default:
        return {
          type: node.type,
          name: node.name || 'unknown'
        };
    }
  }

  /**
   * 比较两个文件结构
   * @param {Object} oldStructure - 旧结构
   * @param {Object} newStructure - 新结构
   * @returns {Object} 比较结果
   */
  compareStructures(oldStructure, newStructure) {
    const comparison = {
      changed: false,
      additions: {
        imports: [],
        exports: [],
        functions: [],
        classes: [],
        variables: []
      },
      modifications: {
        imports: [],
        exports: [],
        functions: [],
        classes: [],
        variables: []
      },
      deletions: {
        imports: [],
        exports: [],
        functions: [],
        classes: [],
        variables: []
      },
      conflicts: [],
      summary: {
        totalChanges: 0,
        addedItems: 0,
        modifiedItems: 0,
        deletedItems: 0
      }
    };

    // 比较各个类型的结构
    ['imports', 'exports', 'functions', 'classes', 'variables'].forEach(type => {
      const oldItems = oldStructure[type] || [];
      const newItems = newStructure[type] || [];
      
      const result = this.compareItems(oldItems, newItems, type);
      
      comparison.additions[type] = result.additions;
      comparison.modifications[type] = result.modifications;
      comparison.deletions[type] = result.deletions;
      comparison.conflicts.push(...result.conflicts);
    });

    // 计算总变更
    Object.keys(comparison.additions).forEach(type => {
      comparison.summary.addedItems += comparison.additions[type].length;
      comparison.summary.modifiedItems += comparison.modifications[type].length;
      comparison.summary.deletedItems += comparison.deletions[type].length;
    });

    comparison.summary.totalChanges = 
      comparison.summary.addedItems + 
      comparison.summary.modifiedItems + 
      comparison.summary.deletedItems;

    comparison.changed = comparison.summary.totalChanges > 0;

    return comparison;
  }

  /**
   * 比较同类型的项目
   * @param {Array} oldItems - 旧项目
   * @param {Array} newItems - 新项目
   * @param {string} type - 类型
   * @returns {Object} 比较结果
   */
  compareItems(oldItems, newItems, type) {
    const result = {
      additions: [],
      modifications: [],
      deletions: [],
      conflicts: []
    };

    // 创建映射表
    const oldMap = new Map();
    const newMap = new Map();

    oldItems.forEach(item => {
      const key = this.getItemKey(item, type);
      oldMap.set(key, item);
    });

    newItems.forEach(item => {
      const key = this.getItemKey(item, type);
      newMap.set(key, item);
    });

    // 查找新增项
    newMap.forEach((newItem, key) => {
      if (!oldMap.has(key)) {
        result.additions.push(newItem);
      }
    });

    // 查找删除项
    oldMap.forEach((oldItem, key) => {
      if (!newMap.has(key)) {
        result.deletions.push(oldItem);
      }
    });

    // 查找修改项
    oldMap.forEach((oldItem, key) => {
      if (newMap.has(key)) {
        const newItem = newMap.get(key);
        if (oldItem.hash !== newItem.hash) {
          result.modifications.push({
            old: oldItem,
            new: newItem,
            key
          });

          // 检查冲突
          if (this.hasConflict(oldItem, newItem, type)) {
            result.conflicts.push({
              type: 'modification',
              item: key,
              reason: '结构变更可能导致冲突',
              old: oldItem,
              new: newItem
            });
          }
        }
      }
    });

    return result;
  }

  /**
   * 获取项目的唯一键
   * @param {Object} item - 项目
   * @param {string} type - 类型
   * @returns {string} 唯一键
   */
  getItemKey(item, type) {
    switch (type) {
      case 'imports':
        return `${item.source}-${item.specifiers.map(s => s.local).join(',')}`;
      case 'exports':
        return item.declaration ? item.declaration.name : item.specifiers.map(s => s.exported).join(',');
      case 'functions':
      case 'classes':
      case 'variables':
        return item.name;
      default:
        return item.name || item.type;
    }
  }

  /**
   * 检查是否有冲突
   * @param {Object} oldItem - 旧项目
   * @param {Object} newItem - 新项目
   * @param {string} type - 类型
   * @returns {boolean} 是否有冲突
   */
  hasConflict(oldItem, newItem, type) {
    if (type === 'functions') {
      // 检查函数签名变更
      const oldParams = oldItem.params || [];
      const newParams = newItem.params || [];
      
      if (oldParams.length !== newParams.length) {
        return true;
      }
      
      for (let i = 0; i < oldParams.length; i++) {
        if (oldParams[i].name !== newParams[i].name) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * 执行增量更新
   * @param {string} filePath - 文件路径
   * @param {string} newCode - 新代码
   * @param {Object} options - 更新选项
   * @returns {Promise<Object>} 更新结果
   */
  async performIncrementalUpdate(filePath, newCode, options = {}) {
    const updateOptions = {
      ...this.config.incrementalOptions,
      ...options
    };

    try {
      // 分析现有文件
      const oldAnalysis = await this.analyzeFile(filePath);
      
      // 分析新代码
      const newAst = this.parseCode(newCode);
      const newStructure = this.extractStructure(newAst);
      
      // 如果文件不存在，直接创建
      if (!oldAnalysis.exists) {
        await fs.writeFile(filePath, newCode, 'utf8');
        return {
          success: true,
          action: 'create',
          changes: null,
          conflicts: [],
          finalCode: newCode
        };
      }

      // 比较结构
      const comparison = this.compareStructures(oldAnalysis.structure, newStructure);
      
      // 如果没有变更，跳过更新
      if (!comparison.changed) {
        return {
          success: true,
          action: 'skip',
          reason: '无变更',
          changes: comparison,
          conflicts: [],
          finalCode: oldAnalysis.content
        };
      }

      // 执行合并
      const mergeResult = await this.mergeCode(
        oldAnalysis.ast,
        newAst,
        comparison,
        updateOptions
      );

      // 写入文件
      if (mergeResult.success) {
        await fs.writeFile(filePath, mergeResult.code, 'utf8');
      }

      return {
        success: mergeResult.success,
        action: 'update',
        changes: comparison,
        conflicts: mergeResult.conflicts,
        finalCode: mergeResult.code,
        error: mergeResult.error
      };

    } catch (error) {
      return {
        success: false,
        action: 'error',
        error: error.message,
        changes: null,
        conflicts: [],
        finalCode: null
      };
    }
  }

  /**
   * 合并代码
   * @param {Object} oldAst - 旧AST
   * @param {Object} newAst - 新AST
   * @param {Object} comparison - 比较结果
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 合并结果
   */
  async mergeCode(oldAst, newAst, comparison, options) {
    try {
      const mergedAst = _.cloneDeep(oldAst);
      const conflicts = [];

      // 处理新增项
      await this.addNewItems(mergedAst, newAst, comparison.additions);

      // 处理修改项
      await this.updateModifiedItems(mergedAst, newAst, comparison.modifications, options, conflicts);

      // 处理删除项（根据配置决定是否删除）
      if (options.removeDeleted) {
        await this.removeDeletedItems(mergedAst, comparison.deletions);
      }

      // 生成最终代码
      const finalCode = generate(mergedAst, this.config.generatorOptions).code;

      return {
        success: true,
        code: finalCode,
        conflicts,
        error: null
      };

    } catch (error) {
      return {
        success: false,
        code: null,
        conflicts: [],
        error: error.message
      };
    }
  }

  /**
   * 添加新项目
   * @param {Object} mergedAst - 合并的AST
   * @param {Object} newAst - 新AST
   * @param {Object} additions - 新增项
   */
  async addNewItems(mergedAst, newAst, additions) {
    // 添加新的导入
    additions.imports.forEach(importItem => {
      const importNode = this.findNodeByHash(newAst, importItem.hash);
      if (importNode) {
        mergedAst.body.unshift(importNode);
      }
    });

    // 添加新的函数
    additions.functions.forEach(funcItem => {
      const funcNode = this.findNodeByHash(newAst, funcItem.hash);
      if (funcNode) {
        mergedAst.body.push(funcNode);
      }
    });

    // 添加新的导出
    additions.exports.forEach(exportItem => {
      const exportNode = this.findNodeByHash(newAst, exportItem.hash);
      if (exportNode) {
        mergedAst.body.push(exportNode);
      }
    });
  }

  /**
   * 更新修改的项目
   * @param {Object} mergedAst - 合并的AST
   * @param {Object} newAst - 新AST
   * @param {Object} modifications - 修改项
   * @param {Object} options - 选项
   * @param {Array} conflicts - 冲突列表
   */
  async updateModifiedItems(mergedAst, newAst, modifications, options, conflicts) {
    // 处理函数修改
    modifications.functions.forEach(mod => {
      const oldNode = this.findNodeByHash(mergedAst, mod.old.hash);
      const newNode = this.findNodeByHash(newAst, mod.new.hash);
      
      if (oldNode && newNode) {
        if (options.conflictResolution === 'rename') {
          // 重命名策略：保留旧函数，添加新函数
          const renamedNode = _.cloneDeep(newNode);
          this.renameFunction(renamedNode, `${mod.new.name}_v2`);
          mergedAst.body.push(renamedNode);
          
          conflicts.push({
            type: 'rename',
            original: mod.old.name,
            renamed: `${mod.new.name}_v2`,
            reason: '函数签名变更'
          });
        } else if (options.conflictResolution === 'overwrite') {
          // 覆盖策略：直接替换
          this.replaceNode(mergedAst, oldNode, newNode);
        }
        // skip策略：不做任何操作
      }
    });
  }

  /**
   * 删除已删除的项目
   * @param {Object} mergedAst - 合并的AST
   * @param {Object} deletions - 删除项
   */
  async removeDeletedItems(mergedAst, deletions) {
    // 删除函数
    deletions.functions.forEach(funcItem => {
      const node = this.findNodeByHash(mergedAst, funcItem.hash);
      if (node) {
        this.removeNode(mergedAst, node);
      }
    });
  }

  /**
   * 根据哈希查找节点
   * @param {Object} ast - AST对象
   * @param {string} hash - 节点哈希
   * @returns {Object|null} 找到的节点
   */
  findNodeByHash(ast, hash) {
    let foundNode = null;
    
    traverse(ast, {
      enter(path) {
        if (this.generateNodeHash(path.node) === hash) {
          foundNode = path.node;
          path.stop();
        }
      }.bind(this)
    });
    
    return foundNode;
  }

  /**
   * 重命名函数
   * @param {Object} node - 函数节点
   * @param {string} newName - 新名称
   */
  renameFunction(node, newName) {
    if (node.type === 'FunctionDeclaration' && node.id) {
      node.id.name = newName;
    }
  }

  /**
   * 替换节点
   * @param {Object} ast - AST对象
   * @param {Object} oldNode - 旧节点
   * @param {Object} newNode - 新节点
   */
  replaceNode(ast, oldNode, newNode) {
    const index = ast.body.indexOf(oldNode);
    if (index !== -1) {
      ast.body[index] = newNode;
    }
  }

  /**
   * 删除节点
   * @param {Object} ast - AST对象
   * @param {Object} node - 要删除的节点
   */
  removeNode(ast, node) {
    const index = ast.body.indexOf(node);
    if (index !== -1) {
      ast.body.splice(index, 1);
    }
  }

  /**
   * 生成内容哈希
   * @param {string} content - 内容
   * @returns {string} 哈希值
   */
  generateHash(content) {
    return crypto
      .createHash(this.config.incrementalOptions.hashAlgorithm)
      .update(content)
      .digest('hex');
  }

  /**
   * 生成节点哈希
   * @param {Object} node - AST节点
   * @returns {string} 哈希值
   */
  generateNodeHash(node) {
    // 移除位置信息后生成哈希
    const cleanNode = this.cleanNodeForHashing(node);
    const nodeString = JSON.stringify(cleanNode);
    return this.generateHash(nodeString);
  }

  /**
   * 清理节点用于哈希计算
   * @param {Object} node - 原始节点
   * @returns {Object} 清理后的节点
   */
  cleanNodeForHashing(node) {
    const cleaned = _.cloneDeep(node);
    
    // 递归删除位置信息
    const removePositionInfo = (obj) => {
      if (obj && typeof obj === 'object') {
        delete obj.start;
        delete obj.end;
        delete obj.loc;
        delete obj.range;
        
        Object.values(obj).forEach(value => {
          if (Array.isArray(value)) {
            value.forEach(removePositionInfo);
          } else if (value && typeof value === 'object') {
            removePositionInfo(value);
          }
        });
      }
    };
    
    removePositionInfo(cleaned);
    return cleaned;
  }

  /**
   * 获取分析统计信息
   * @param {Object} structure - 代码结构
   * @returns {Object} 统计信息
   */
  getAnalysisStats(structure) {
    return {
      imports: structure.imports.length,
      exports: structure.exports.length,
      functions: structure.functions.length,
      classes: structure.classes.length,
      variables: structure.variables.length,
      comments: structure.comments.length,
      totalLines: structure.metadata.totalLines,
      complexity: this.calculateComplexity(structure)
    };
  }

  /**
   * 计算代码复杂度
   * @param {Object} structure - 代码结构
   * @returns {number} 复杂度分数
   */
  calculateComplexity(structure) {
    let complexity = 0;
    
    // 基于函数数量和参数复杂度计算
    structure.functions.forEach(func => {
      complexity += 1; // 基础复杂度
      complexity += func.params.length * 0.5; // 参数复杂度
      if (func.async) complexity += 1; // 异步函数
      if (func.generator) complexity += 1; // 生成器函数
    });
    
    // 基于类的复杂度
    structure.classes.forEach(cls => {
      complexity += 2; // 类基础复杂度
      complexity += cls.methods.length; // 方法复杂度
    });
    
    return Math.round(complexity);
  }
}

module.exports = ASTAnalyzer;