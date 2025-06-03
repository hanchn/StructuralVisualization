/**
 * 代码生成器测试
 */

const CodeGenerator = require('../src/core/code-generator');
const fs = require('fs-extra');
const path = require('path');

describe('CodeGenerator', () => {
  let generator;
  let testOutputDir;
  
  beforeEach(() => {
    generator = new CodeGenerator({
      typescript: true,
      naming: {
        fileNaming: { separator: '-' },
        methodNaming: { style: 'camelCase' }
      }
    });
    
    testOutputDir = path.join(__dirname, 'temp-output');
  });
  
  afterEach(async () => {
    // 清理测试文件
    if (await fs.pathExists(testOutputDir)) {
      await fs.remove(testOutputDir);
    }
  });
  
  describe('代码生成', () => {
    const mockApiData = {
      pid: 'p001',
      cid: 'c001',
      apis: [
        {
          path: '/api/v1/users',
          method: 'get',
          summary: '获取用户列表',
          parameters: [
            { name: 'page', type: 'number', in: 'query', required: false },
            { name: 'limit', type: 'number', in: 'query', required: false }
          ],
          responses: {
            '200': {
              description: '成功',
              example: { users: [], total: 0 }
            }
          }
        },
        {
          path: '/api/v1/users',
          method: 'post',
          summary: '创建用户',
          parameters: [
            { name: 'name', type: 'string', in: 'body', required: true },
            { name: 'email', type: 'string', in: 'body', required: true }
          ],
          responses: {
            '201': {
              description: '创建成功',
              example: { id: 1, name: 'test', email: 'test@example.com' }
            }
          }
        }
      ]
    };
    
    test('生成所有文件', async () => {
      const result = await generator.generateAll(mockApiData, {
        outputDir: testOutputDir,
        overwrite: true
      });
      
      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(3); // api, logic, types
      expect(result.errors).toHaveLength(0);
      expect(result.summary).toBeDefined();
      
      // 检查文件是否存在
      const apiFile = path.join(testOutputDir, 'api', 'p001-c001-api.js');
      const logicFile = path.join(testOutputDir, 'logic', 'p001-c001-logic.js');
      const typesFile = path.join(testOutputDir, 'types', 'p001-c001-types.d.ts');
      
      expect(await fs.pathExists(apiFile)).toBe(true);
      expect(await fs.pathExists(logicFile)).toBe(true);
      expect(await fs.pathExists(typesFile)).toBe(true);
    });
    
    test('生成API文件', async () => {
      const result = await generator.generateApiFile(
        'p001', 'c001', mockApiData.apis,
        { outputDir: path.join(testOutputDir, 'api'), overwrite: true }
      );
      
      expect(result.type).toBe('api');
      expect(result.methods).toBe(2);
      
      const content = await fs.readFile(result.path, 'utf8');
      expect(content).toContain('export async function p001C001ApiUsers');
      expect(content).toContain('export async function p001C001ApiUsersPost');
      expect(content).toContain('import request from');
    });
    
    test('生成逻辑文件', async () => {
      // 先生成API文件
      await generator.generateApiFile(
        'p001', 'c001', mockApiData.apis,
        { outputDir: path.join(testOutputDir, 'api'), overwrite: true }
      );
      
      const result = await generator.generateLogicFile(
        'p001', 'c001', mockApiData.apis,
        { outputDir: path.join(testOutputDir, 'logic'), overwrite: true }
      );
      
      expect(result.type).toBe('logic');
      expect(result.methods).toBe(2);
      
      const content = await fs.readFile(result.path, 'utf8');
      expect(content).toContain('export async function p001C001Users');
      expect(content).toContain('export async function p001C001UsersPost');
      expect(content).toContain('try {');
      expect(content).toContain('catch (error)');
    });
    
    test('生成类型文件', async () => {
      const result = await generator.generateTypesFile(
        'p001', 'c001', mockApiData.apis,
        { outputDir: path.join(testOutputDir, 'types'), overwrite: true }
      );
      
      expect(result.type).toBe('types');
      expect(result.types).toBe(2);
      
      const content = await fs.readFile(result.path, 'utf8');
      expect(content).toContain('export interface p001C001ApiUsersParams');
      expect(content).toContain('export interface p001C001ApiUsersResponse');
    });
  });
  
  describe('Mock模式', () => {
    test('生成Mock API文件', async () => {
      const mockApiData = {
        pid: 'p001',
        cid: 'c001',
        apis: [{
          path: '/api/v1/users',
          method: 'get',
          summary: '获取用户列表',
          responses: {
            '200': {
              example: { users: [{ id: 1, name: 'test' }] }
            }
          }
        }]
      };
      
      const result = await generator.generateApiFile(
        'p001', 'c001', mockApiData.apis,
        { 
          outputDir: path.join(testOutputDir, 'api'), 
          mockMode: true,
          overwrite: true 
        }
      );
      
      const content = await fs.readFile(result.path, 'utf8');
      expect(content).toContain('// Mock模式');
      expect(content).toContain('Promise.resolve');
      expect(content).not.toContain('import request');
    });
  });
  
  describe('方法生成', () => {
    test('生成API方法', () => {
      const api = {
        path: '/api/v1/users/{id}',
        method: 'get',
        summary: '获取用户详情',
        parameters: [
          { name: 'id', type: 'number', in: 'path', required: true },
          { name: 'include', type: 'string', in: 'query', required: false }
        ]
      };
      
      const method = generator.generateApiMethod('p001', 'c001', api, false);
      
      expect(method).toContain('export async function p001C001ApiUsersByIdGet');
      expect(method).toContain('id, include?');
      expect(method).toContain('${id}');
      expect(method).toContain('params: { include }');
    });
    
    test('生成逻辑方法', () => {
      const api = {
        path: '/api/v1/users',
        method: 'post',
        summary: '创建用户',
        parameters: [
          { name: 'name', type: 'string', in: 'body', required: true }
        ]
      };
      
      const method = generator.generateLogicMethod('p001', 'c001', api, false);
      
      expect(method).toContain('export async function p001C001UsersPost');
      expect(method).toContain('try {');
      expect(method).toContain('catch (error)');
      expect(method).toContain('success: true');
      expect(method).toContain('success: false');
    });
  });
  
  describe('错误处理', () => {
    test('文件已存在时抛出错误', async () => {
      const apiFile = path.join(testOutputDir, 'api', 'p001-c001-api.js');
      await fs.ensureDir(path.dirname(apiFile));
      await fs.writeFile(apiFile, 'existing content');
      
      await expect(generator.generateApiFile(
        'p001', 'c001', [],
        { outputDir: path.join(testOutputDir, 'api'), overwrite: false }
      )).rejects.toThrow('API文件已存在');
    });
    
    test('覆盖模式正常工作', async () => {
      const apiFile = path.join(testOutputDir, 'api', 'p001-c001-api.js');
      await fs.ensureDir(path.dirname(apiFile));
      await fs.writeFile(apiFile, 'existing content');
      
      const result = await generator.generateApiFile(
        'p001', 'c001', [],
        { outputDir: path.join(testOutputDir, 'api'), overwrite: true }
      );
      
      expect(result.type).toBe('api');
      
      const content = await fs.readFile(apiFile, 'utf8');
      expect(content).not.toBe('existing content');
    });
  });
});