/**
 * Mock数据生成器
 * 基于API文档生成mock数据和模拟接口代码
 */
export class MockGenerator {
  constructor(options = {}) {
    this.options = {
      mockDataSize: 10, // 默认生成10条数据
      includeServer: true, // 是否生成mock服务器
      port: 3001, // mock服务器端口
      delay: 100, // 模拟网络延迟(ms)
      ...options
    };
  }

  /**
   * 从AST生成Mock代码
   * @param {Object} ast - API AST
   * @returns {Object} 包含mock数据和代码的对象
   */
  generate(ast) {
    const mockData = this.generateMockData(ast);
    const mockCode = this.generateMockCode(ast, mockData);
    const serverCode = this.generateMockServer(ast, mockData);
    
    return {
      mockData,
      mockCode,
      serverCode
    };
  }

  /**
   * 生成Mock数据
   */
  generateMockData(ast) {
    const mockData = {};
    
    ast.children.forEach(apiNode => {
      const { operationId, method, path } = apiNode;
      const responseSchema = this.getResponseSchema(apiNode);
      
      mockData[operationId] = {
        method,
        path,
        data: this.generateDataFromSchema(responseSchema)
      };
    });
    
    return mockData;
  }

  /**
   * 根据Schema生成数据
   */
  generateDataFromSchema(schema) {
    if (!schema || !schema.type) {
      return this.generateDefaultResponse();
    }
    
    switch (schema.type) {
      case 'object':
        return this.generateObjectData(schema);
      case 'array':
        return this.generateArrayData(schema);
      case 'string':
        return this.generateStringData(schema);
      case 'number':
      case 'integer':
        return this.generateNumberData(schema);
      case 'boolean':
        return Math.random() > 0.5;
      default:
        return this.generateDefaultResponse();
    }
  }

  /**
   * 生成对象数据
   */
  generateObjectData(schema) {
    const obj = {};
    const properties = schema.properties || {};
    
    Object.entries(properties).forEach(([key, propSchema]) => {
      obj[key] = this.generateDataFromSchema(propSchema);
    });
    
    // 如果没有定义properties，生成默认对象
    if (Object.keys(obj).length === 0) {
      return {
        id: this.generateId(),
        name: this.generateName(),
        status: 'success',
        timestamp: new Date().toISOString()
      };
    }
    
    return obj;
  }

  /**
   * 生成数组数据
   */
  generateArrayData(schema) {
    const items = schema.items || { type: 'object' };
    const size = Math.min(this.options.mockDataSize, 10);
    
    return Array.from({ length: size }, () => 
      this.generateDataFromSchema(items)
    );
  }

  /**
   * 生成字符串数据
   */
  generateStringData(schema) {
    const format = schema.format;
    
    switch (format) {
      case 'email':
        return `user${this.generateId()}@example.com`;
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'date-time':
        return new Date().toISOString();
      case 'uuid':
        return this.generateUUID();
      default:
        return this.generateName();
    }
  }

  /**
   * 生成数字数据
   */
  generateNumberData(schema) {
    const min = schema.minimum || 0;
    const max = schema.maximum || 1000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 生成默认响应
   */
  generateDefaultResponse() {
    return {
      code: 200,
      message: 'success',
      data: {
        id: this.generateId(),
        name: this.generateName(),
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 生成Mock代码
   */
  generateMockCode(ast, mockData) {
    const methods = ast.children.map(apiNode => {
      const { operationId, summary } = apiNode;
      const data = mockData[operationId]?.data;
      
      return `/**
 * ${summary} (Mock)
 */
export async function ${operationId}(...args) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, ${this.options.delay}));
  
  // 返回mock数据
  return ${JSON.stringify(data, null, 2)};
}`;
    }).join('\n\n');
    
    const exports = ast.children.map(node => node.operationId).join(', ');
    
    return `// Mock API 代码 - 自动生成
// 生成时间: ${new Date().toISOString()}

${methods}

// 导出所有Mock方法
export { ${exports} };

// 默认导出
export default { ${exports} };`;
  }

  /**
   * 生成Mock服务器代码
   */
  generateMockServer(ast, mockData) {
    const routes = ast.children.map(apiNode => {
      const { operationId, method, path } = apiNode;
      const data = mockData[operationId]?.data;
      
      // 转换路径参数格式
      const expressPath = path.replace(/{([^}]+)}/g, ':$1');
      
      return `  // ${apiNode.summary}
  app.${method.toLowerCase()}('${expressPath}', (req, res) => {
    setTimeout(() => {
      res.json(${JSON.stringify(data, null, 6)});
    }, ${this.options.delay});
  });`;
    }).join('\n\n');
    
    return `// Mock服务器 - 自动生成
// 生成时间: ${new Date().toISOString()}

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = ${this.options.port};

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  console.log(\`\${new Date().toISOString()} - \${req.method} \${req.path}\`);
  next();
});

// API路由
${routes}

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: 'API not found',
    path: req.originalUrl
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(\`🚀 Mock服务器启动成功!\`);
  console.log(\`📍 地址: http://localhost:\${PORT}\`);
  console.log(\`📝 API文档: http://localhost:\${PORT}/docs\`);
});

export default app;`;
  }

  /**
   * 获取响应Schema
   */
  getResponseSchema(apiNode) {
    const responses = apiNode.children.responses;
    if (!responses || !responses.children) return null;
    
    // 优先获取200响应
    const successResponse = responses.children.find(r => r.statusCode === '200');
    if (successResponse && successResponse.content) {
      const jsonContent = successResponse.content['application/json'];
      return jsonContent?.schema;
    }
    
    return null;
  }

  // 工具方法
  generateId() {
    return Math.floor(Math.random() * 10000) + 1;
  }

  generateName() {
    const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
    return names[Math.floor(Math.random() * names.length)];
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}