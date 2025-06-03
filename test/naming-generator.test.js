/**
 * 命名生成器测试
 */

const NamingGenerator = require('../src/core/naming-generator');

describe('NamingGenerator', () => {
  let generator;
  
  beforeEach(() => {
    generator = new NamingGenerator();
  });
  
  describe('文件名生成', () => {
    test('生成API文件名', () => {
      const fileName = generator.generateApiFileName('p001', 'c001');
      expect(fileName).toBe('p001-c001-api.js');
    });
    
    test('生成逻辑文件名', () => {
      const fileName = generator.generateLogicFileName('p001', 'c001');
      expect(fileName).toBe('p001-c001-logic.js');
    });
    
    test('生成类型文件名', () => {
      const fileName = generator.generateTypesFileName('p001', 'c001');
      expect(fileName).toBe('p001-c001-types.d.ts');
    });
  });
  
  describe('方法名生成', () => {
    test('生成API方法名 - GET请求', () => {
      const methodName = generator.generateApiMethodName('p001', 'c001', '/api/v1/users', 'get');
      expect(methodName).toBe('p001C001ApiUsers');
    });
    
    test('生成API方法名 - POST请求', () => {
      const methodName = generator.generateApiMethodName('p001', 'c001', '/api/v1/users', 'post');
      expect(methodName).toBe('p001C001ApiUsersPost');
    });
    
    test('生成API方法名 - 带参数路径', () => {
      const methodName = generator.generateApiMethodName('p001', 'c001', '/api/v1/users/{id}', 'get');
      expect(methodName).toBe('p001C001ApiUsersByIdGet');
    });
    
    test('生成逻辑方法名', () => {
      const methodName = generator.generateLogicMethodName('p001', 'c001', '/api/v1/users/profile', 'get');
      expect(methodName).toBe('p001C001UsersProfile');
    });
  });
  
  describe('路径处理', () => {
    test('清理API路径', () => {
      expect(generator.cleanApiPath('/api/v1/users/')).toBe('users');
      expect(generator.cleanApiPath('/api/users/{id}/profile')).toBe('users/ByIdProfile');
    });
    
    test('解析路径为方法名部分', () => {
      expect(generator.parsePathToParts('users/profile')).toBe('UsersProfile');
      expect(generator.parsePathToParts('user-management/settings')).toBe('UserManagementSettings');
    });
  });
  
  describe('命名验证', () => {
    test('验证文件名', () => {
      expect(generator.validateNaming('p001-c001-api.js', 'file')).toEqual({ valid: true, error: null });
      expect(generator.validateNaming('Invalid File.js', 'file')).toEqual({ 
        valid: false, 
        error: '文件名应为小写字母、数字和连字符组合' 
      });
    });
    
    test('验证方法名', () => {
      expect(generator.validateNaming('p001C001ApiUsers', 'method')).toEqual({ valid: true, error: null });
      expect(generator.validateNaming('123InvalidMethod', 'method')).toEqual({ 
        valid: false, 
        error: '方法名应为驼峰命名法' 
      });
    });
  });
  
  describe('命名摘要', () => {
    test('生成命名摘要', () => {
      const apis = [
        { path: '/api/v1/users', method: 'get' },
        { path: '/api/v1/users', method: 'post' },
        { path: '/api/v1/users/{id}', method: 'get' }
      ];
      
      const summary = generator.generateNamingSummary('p001', 'c001', apis);
      
      expect(summary.files.api).toBe('p001-c001-api.js');
      expect(summary.files.logic).toBe('p001-c001-logic.js');
      expect(summary.methods.api).toHaveLength(3);
      expect(summary.methods.logic).toHaveLength(3);
      expect(summary.statistics.totalMethods).toBe(6);
    });
  });
  
  describe('配置管理', () => {
    test('获取配置', () => {
      const config = generator.getConfig();
      expect(config.fileNaming.separator).toBe('-');
      expect(config.methodNaming.style).toBe('camelCase');
    });
    
    test('更新配置', () => {
      generator.updateConfig({
        fileNaming: { separator: '_' },
        methodNaming: { style: 'PascalCase' }
      });
      
      const fileName = generator.generateApiFileName('p001', 'c001');
      expect(fileName).toBe('p001_c001_api.js');
      
      const methodName = generator.generateApiMethodName('p001', 'c001', '/users', 'get');
      expect(methodName).toBe('P001C001ApiUsers');
    });
  });
});