#!/usr/bin/env node
/**
 * Mock代码生成脚本
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { APIParser } from '../src/core/parser.js';
import { MockGenerator } from '../src/core/mock-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 示例API文档
const sampleAPIDoc = {
  "openapi": "3.0.0",
  "info": {
    "title": "用户管理API",
    "version": "1.0.0",
    "description": "用户管理系统API文档"
  },
  "paths": {
    "/users": {
      "get": {
        "summary": "获取用户列表",
        "operationId": "getUsers",
        "parameters": [
          {
            "name": "page",
            "in": "query",
            "schema": { "type": "integer", "default": 1 },
            "description": "页码"
          },
          {
            "name": "size",
            "in": "query",
            "schema": { "type": "integer", "default": 10 },
            "description": "每页数量"
          }
        ],
        "responses": {
          "200": {
            "description": "成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": { "type": "integer" },
                    "message": { "type": "string" },
                    "data": {
                      "type": "object",
                      "properties": {
                        "list": {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "id": { "type": "integer" },
                              "name": { "type": "string" },
                              "email": { "type": "string", "format": "email" },
                              "age": { "type": "integer" },
                              "status": { "type": "string" },
                              "createdAt": { "type": "string", "format": "date-time" }
                            }
                          }
                        },
                        "total": { "type": "integer" },
                        "page": { "type": "integer" },
                        "size": { "type": "integer" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "创建用户",
        "operationId": "createUser",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": { "type": "string" },
                  "email": { "type": "string", "format": "email" },
                  "age": { "type": "integer" }
                },
                "required": ["name", "email"]
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "创建成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": { "type": "integer" },
                    "message": { "type": "string" },
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "integer" },
                        "name": { "type": "string" },
                        "email": { "type": "string" },
                        "age": { "type": "integer" },
                        "status": { "type": "string" },
                        "createdAt": { "type": "string", "format": "date-time" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/users/{id}": {
      "get": {
        "summary": "获取用户详情",
        "operationId": "getUserById",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "integer" }
          }
        ],
        "responses": {
          "200": {
            "description": "成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": { "type": "integer" },
                    "message": { "type": "string" },
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "integer" },
                        "name": { "type": "string" },
                        "email": { "type": "string" },
                        "age": { "type": "integer" },
                        "status": { "type": "string" },
                        "createdAt": { "type": "string", "format": "date-time" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "put": {
        "summary": "更新用户",
        "operationId": "updateUser",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "integer" }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": { "type": "string" },
                  "email": { "type": "string", "format": "email" },
                  "age": { "type": "integer" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "更新成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": { "type": "integer" },
                    "message": { "type": "string" },
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "integer" },
                        "name": { "type": "string" },
                        "email": { "type": "string" },
                        "age": { "type": "integer" },
                        "status": { "type": "string" },
                        "updatedAt": { "type": "string", "format": "date-time" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "删除用户",
        "operationId": "deleteUser",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "integer" }
          }
        ],
        "responses": {
          "200": {
            "description": "删除成功",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "code": { "type": "integer" },
                    "message": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

async function generateMockCode() {
  try {
    console.log('🚀 开始生成Mock代码...');
    
    // 1. 解析API文档
    const parser = new APIParser();
    const ast = parser.parse(sampleAPIDoc, 'swagger');
    
    // 2. 生成Mock代码
    const mockGenerator = new MockGenerator({
      mockDataSize: 5,
      delay: 200,
      port: 3001
    });
    
    const { mockData, mockCode, serverCode } = mockGenerator.generate(ast);
    
    // 3. 创建输出目录
    const outputDir = path.join(rootDir, 'mock');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 4. 写入文件
    fs.writeFileSync(path.join(outputDir, 'mock-data.json'), JSON.stringify(mockData, null, 2));
    fs.writeFileSync(path.join(outputDir, 'mock-api.js'), mockCode);
    fs.writeFileSync(path.join(outputDir, 'mock-server.js'), serverCode);
    
    // 5. 生成使用说明
    const readme = `# Mock API 使用说明

## 文件说明

- \`mock-data.json\`: Mock数据
- \`mock-api.js\`: Mock API方法
- \`mock-server.js\`: Mock服务器

## 使用方式

### 1. 直接使用Mock方法

\`\`\`javascript
import { getUsers, createUser, getUserById } from './mock-api.js';

// 获取用户列表
const users = await getUsers();
console.log(users);

// 创建用户
const newUser = await createUser({ name: '张三', email: 'zhangsan@example.com' });
console.log(newUser);
\`\`\`

### 2. 启动Mock服务器

\`\`\`bash
# 安装依赖
npm install express cors

# 启动服务器
node mock/mock-server.js
\`\`\`

服务器将在 http://localhost:3001 启动

### 3. API端点

- GET /users - 获取用户列表
- POST /users - 创建用户
- GET /users/:id - 获取用户详情
- PUT /users/:id - 更新用户
- DELETE /users/:id - 删除用户

## 自定义Mock数据

您可以直接编辑 \`mock-data.json\` 文件来自定义Mock数据。
`;
    
    fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
    
    console.log('✅ Mock代码生成完成!');
    console.log(`📁 输出目录: ${outputDir}`);
    console.log('📄 生成的文件:');
    console.log('  - mock-data.json (Mock数据)');
    console.log('  - mock-api.js (Mock API方法)');
    console.log('  - mock-server.js (Mock服务器)');
    console.log('  - README.md (使用说明)');
    console.log('');
    console.log('🎯 下一步:');
    console.log('  1. npm install express cors (安装服务器依赖)');
    console.log('  2. npm run mock:server (启动Mock服务器)');
    console.log('  3. 或直接导入mock-api.js使用Mock方法');
    
  } catch (error) {
    console.error('❌ 生成Mock代码失败:', error.message);
    process.exit(1);
  }
}

// 运行生成器
generateMockCode();