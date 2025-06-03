/**
 * AST分析器测试
 */

const ASTAnalyzer = require('../src/core/ast-analyzer');
const fs = require('fs-extra');
const path = require('path');

describe('ASTAnalyzer', () => {
  let analyzer;
  let testDir;
  
  beforeEach(() => {
    analyzer = new ASTAnalyzer();
    testDir = path.join(__dirname, 'temp-ast');
  });
  
  afterEach(async () => {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });
  
  describe('代码解析', () => {
    test('解析简单函数', () => {
      const code = `
        function hello(name) {
          return \`Hello, \${name}!\`;
        }
        
        export { hello };
      `;
      
      const ast = analyzer.parseCode(code);
      expect(ast.type).toBe('File');
      expect(ast.program.body).toHaveLength(2);
    });
    
    test('解析复杂代码结构', () => {
      const code = `
        import React from 'react';
        import { useState } from 'react';
        
        class MyComponent extends React.Component {
          constructor(props) {
            super(props);
            this.state = { count: 0 };
          }
          
          increment = () => {
            this.setState({ count: this.state.count + 1 });
          }
          
          render() {
            return <div>{this.state.count}</div>;
          }
        }
        
        const useCounter = (initial = 0) => {
          const [count, setCount] = useState(initial);
          return { count, increment: () => setCount(count + 1) };
        };
        
        export default MyComponent;
        export { useCounter };
      `;
      
      const ast = analyzer.parseCode(code);
      const structure = analyzer.extractStructure(ast);
      
      expect(structure.imports).toHaveLength(2);
      expect(structure.exports).toHaveLength(2);
      expect(structure.functions).toHaveLength(1); // useCounter
      expect(structure.classes).toHaveLength(1); // MyComponent
    });
  });
  
  describe('结构提取', () => {
    test('提取导入语句', () => {
      const code = `
        import React from 'react';
        import { useState, useEffect } from 'react';
        import * as utils from './utils';
      `;
      
      const ast = analyzer.parseCode(code);
      const structure = analyzer.extractStructure(ast);
      
      expect(structure.imports).toHaveLength(3);
      expect(structure.imports[0].source).toBe('react');
      expect(structure.imports[1].specifiers).toHaveLength(2);
    });
    
    test('提取函数信息', () => {
      const code = `
        function regularFunction(a, b = 10) {
          return a + b;
        }
        
        const arrowFunction = async (data) => {
          return await processData(data);
        };
        
        function* generatorFunction() {
          yield 1;
          yield 2;
        }
      `;
      
      const ast = analyzer.parseCode(code);
      const structure = analyzer.extractStructure(ast);
      
      expect(structure.functions).toHaveLength(3);
      
      const regular = structure.functions.find(f => f.name === 'regularFunction');
      expect(regular.params).toHaveLength(2);
      expect(regular.params[1].type).toBe('default');
      
      const arrow = structure.functions.find(f => f.name === 'arrowFunction');
      expect(arrow.async).toBe(true);
      
      const generator = structure.functions.find(f => f.name === 'generatorFunction');
      expect(generator.generator).toBe(true);
    });
    
    test('提取类信息', () => {
      const code = `
        class BaseClass {
          constructor(name) {
            this.name = name;
          }
          
          getName() {
            return this.name;
          }
          
          static create(name) {
            return new BaseClass(name);
          }
        }
        
        class ExtendedClass extends BaseClass {
          async fetchData() {
            return await api.getData();
          }
        }
      `;
      
      const ast = analyzer.parseCode(code);
      const structure = analyzer.extractStructure(ast);
      
      expect(structure.classes).toHaveLength(2);
      
      const base = structure.classes.find(c => c.name === 'BaseClass');
      expect(base.methods).toHaveLength(3);
      expect(base.methods.find(m => m.name === 'create').static).toBe(true);
      
      const extended = structure.classes.find(c => c.name === 'ExtendedClass');
      expect(extended.superClass).toBe('BaseClass');
      expect(extended.methods.find(m => m.name === 'fetchData').async).toBe(true);
    });
  });
  
  describe('文件分析', () => {
    test('分析存在的文件', async () => {
      const testFile = path.join(testDir, 'test.js');
      const code = `
        export function testFunction() {
          return 'test';
        }
      `;
      
      await fs.ensureDir(testDir);
      await fs.writeFile(testFile, code);
      
      const analysis = await analyzer.analyzeFile(testFile);
      
      expect(analysis.exists).toBe(true);
      expect(analysis.hash).toBeDefined();
      expect(analysis.structure.functions).toHaveLength(1);
      expect(analysis.error).toBeNull();
    });
    
    test('分析不存在的文件', async () => {
      const testFile = path.join(testDir, 'nonexistent.js');
      
      const analysis = await analyzer.analyzeFile(testFile);
      
      expect(analysis.exists).toBe(false);
      expect(analysis.structure).toBeNull();
      expect(analysis.error).toBe('文件不存在');
    });
    
    test('分析语法错误的文件', async () => {
      const testFile = path.join(testDir, 'invalid.js');
      const invalidCode = 'function invalid( {';
      
      await fs.ensureDir(testDir);
      await fs.writeFile(testFile, invalidCode);
      
      const analysis = await analyzer.analyzeFile(testFile);
      
      expect(analysis.exists).toBe(true);
      expect(analysis.structure).toBeNull();
      expect(analysis.error).toBeDefined();
    });
  });
  
  describe('结构比较', () => {
    test('检测新增函数', () => {
      const oldStructure = {
        functions: [
          { name: 'oldFunction', hash: 'hash1' }
        ],
        imports: [],
        exports: [],
        classes: [],
        variables: []
      };
      
      const newStructure = {
        functions: [
          { name: 'oldFunction', hash: 'hash1' },
          { name: 'newFunction', hash: 'hash2' }
        ],
        imports: [],
        exports: [],
        classes: [],
        variables: []
      };
      
      const comparison = analyzer.compareStructures(oldStructure, newStructure);
      
      expect(comparison.changed).toBe(true);
      expect(comparison.additions.functions).toHaveLength(1);
      expect(comparison.additions.functions[0].name).toBe('newFunction');
      expect(comparison.summary.addedItems).toBe(1);
    });
    
    test('检测函数修改', () => {
      const oldStructure = {
        functions: [
          { name: 'testFunction', hash: 'oldHash', params: [{ name: 'a' }] }
        ],
        imports: [],
        exports: [],
        classes: [],
        variables: []
      };
      
      const newStructure = {
        functions: [
          { name: 'testFunction', hash: 'newHash', params: [{ name: 'a' }, { name: 'b' }] }
        ],
        imports: [],
        exports: [],
        classes: [],
        variables: []
      };
      
      const comparison = analyzer.compareStructures(oldStructure, newStructure);
      
      expect(comparison.changed).toBe(true);
      expect(comparison.modifications.functions).toHaveLength(1);
      expect(comparison.conflicts).toHaveLength(1); // 参数变更导致冲突
      expect(comparison.summary.modifiedItems).toBe(1);
    });
    
    test('检测删除项', () => {
      const oldStructure = {
        functions: [
          { name: 'keepFunction', hash: 'hash1' },
          { name: 'removeFunction', hash: 'hash2' }
        ],
        imports: [],
        exports: [],
        classes: [],
        variables: []
      };
      
      const newStructure = {
        functions: [
          { name: 'keepFunction', hash: 'hash1' }
        ],
        imports: [],
        exports: [],
        classes: [],
        variables: []
      };
      
      const comparison = analyzer.compareStructures(oldStructure, newStructure);
      
      expect(comparison.changed).toBe(true);
      expect(comparison.deletions.functions).toHaveLength(1);
      expect(comparison.deletions.functions[0].name).toBe('removeFunction');
      expect(comparison.summary.deletedItems).toBe(1);
    });
  });
  
  describe('增量更新', () => {
    test('创建新文件', async () => {
      const testFile = path.join(testDir, 'new.js');
      const newCode = `
        export function newFunction() {
          return 'new';
        }
      `;
      
      await fs.ensureDir(testDir);
      
      const result = await analyzer.performIncrementalUpdate(testFile, newCode);
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('create');
      expect(await fs.pathExists(testFile)).toBe(true);
    });
    
    test('跳过无变更的更新', async () => {
      const testFile = path.join(testDir, 'unchanged.js');
      const code = `
        export function unchangedFunction() {
          return 'unchanged';
        }
      `;
      
      await fs.ensureDir(testDir);
      await fs.writeFile(testFile, code);
      
      const result = await analyzer.performIncrementalUpdate(testFile, code);
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('skip');
      expect(result.reason).toBe('无变更');
    });
    
    test('执行增量更新', async () => {
      const testFile = path.join(testDir, 'update.js');
      const oldCode = `
        export function oldFunction() {
          return 'old';
        }
      `;
      
      const newCode = `
        export function oldFunction() {
          return 'old';
        }
        
        export function newFunction() {
          return 'new';
        }
      `;
      
      await fs.ensureDir(testDir);
      await fs.writeFile(testFile, oldCode);
      
      const result = await analyzer.performIncrementalUpdate(testFile, newCode);
      
      expect(result.success).toBe(true);
      expect(result.action).toBe('update');
      expect(result.changes.summary.addedItems).toBe(1);
      
      const finalContent = await fs.readFile(testFile, 'utf8');
      expect(finalContent).toContain('newFunction');
    });
  });
  
  describe('冲突处理', () => {
    test('重命名冲突解决', async () => {
      const testFile = path.join(testDir, 'conflict.js');
      const oldCode = `
        export function testFunction(a) {
          return a;
        }
      `;
      
      const newCode = `
        export function testFunction(a, b) {
          return a + b;
        }
      `;
      
      await fs.ensureDir(testDir);
      await fs.writeFile(testFile, oldCode);
      
      const result = await analyzer.performIncrementalUpdate(testFile, newCode, {
        conflictResolution: 'rename'
      });
      
      expect(result.success).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('rename');
      
      const finalContent = await fs.readFile(testFile, 'utf8');
      expect(finalContent).toContain('testFunction_v2');
    });
  });
  
  describe('哈希计算', () => {
    test('生成内容哈希', () => {
      const content = 'test content';
      const hash1 = analyzer.generateHash(content);
      const hash2 = analyzer.generateHash(content);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(32); // MD5 hash length
    });
    
    test('生成节点哈希', () => {
      const code = 'function test() { return 1; }';
      const ast = analyzer.parseCode(code);
      const funcNode = ast.program.body[0];
      
      const hash1 = analyzer.generateNodeHash(funcNode);
      const hash2 = analyzer.generateNodeHash(funcNode);
      
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
    });
  });
  
  describe('统计信息', () => {
    test('计算分析统计', () => {
      const structure = {
        imports: [1, 2],
        exports: [1],
        functions: [{ params: [1, 2], async: true }],
        classes: [{ methods: [1, 2, 3] }],
        variables: [1],
        comments: [1, 2],
        metadata: { totalLines: 50 }
      };
      
      const stats = analyzer.getAnalysisStats(structure);
      
      expect(stats.imports).toBe(2);
      expect(stats.exports).toBe(1);
      expect(stats.functions).toBe(1);
      expect(stats.classes).toBe(1);
      expect(stats.totalLines).toBe(50);
      expect(stats.complexity).toBeGreaterThan(0);
    });
  });
});