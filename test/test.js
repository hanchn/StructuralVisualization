import { APICodeGenerator } from '../src/index.js';

// 测试Swagger文档
const swaggerDoc = {
  "openapi": "3.0.0",
  "info": {
    "title": "用户API",
    "version": "1.0.0"
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
            "schema": { "type": "integer" },
            "description": "页码"
          }
        ],
        "responses": {
          "200": {
            "description": "成功"
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
                  "email": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "创建成功"
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
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "成功"
          }
        }
      }
    }
  }
};

// 测试代码生成
console.log('=== 测试Fetch版本 ===');
const fetchGenerator = new APICodeGenerator({
  httpClient: 'fetch',
  baseURL: 'https://api.example.com'
});
const fetchCode = fetchGenerator.generate(swaggerDoc);
console.log(fetchCode);

console.log('\n=== 测试Axios版本 ===');
const axiosGenerator = new APICodeGenerator({
  httpClient: 'axios',
  baseURL: 'https://api.example.com'
});
const axiosCode = axiosGenerator.generate(swaggerDoc);
console.log(axiosCode);

console.log('\n=== 测试TypeScript版本 ===');
const tsGenerator = new APICodeGenerator({
  httpClient: 'axios',
  typescript: true,
  baseURL: 'https://api.example.com'
});
const tsCode = tsGenerator.generate(swaggerDoc);
console.log(tsCode);