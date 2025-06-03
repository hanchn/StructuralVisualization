const ApiCodeGenerator = require('../src/index');
const path = require('path');

// 示例API数据
const apiData = {
  "pid": "p001",
  "cid": "c001",
  "baseUrl": "https://api.example.com",
  "apis": [
    {
      "name": "getUserById",
      "path": "/users/:id",
      "method": "GET",
      "pathParams": ["id"],
      "queryParams": ["include", "fields"],
      "bodyParams": [],
      "description": "根据ID获取用户信息",
      "response": {
        "id": "number",
        "name": "string",
        "email": "string"
      }
    },
    {
      "name": "createUser",
      "path": "/users",
      "method": "POST",
      "pathParams": [],
      "queryParams": [],
      "bodyParams": ["name", "email", "password"],
      "description": "创建新用户",
      "response": {
        "id": "number",
        "message": "string"
      }
    },
    {
      "name": "updateUser",
      "path": "/users/:id",
      "method": "PUT",
      "pathParams": ["id"],
      "queryParams": ["notify"],
      "bodyParams": ["name", "email"],
      "description": "更新用户信息",
      "response": {
        "success": "boolean",
        "data": "object"
      }
    }
  ]
};

async function runDemo() {
  try {
    console.log('🚀 开始生成代码...');
    
    const generator = new ApiCodeGenerator({
      outputDir: './examples/output'
    });
    
    // 生成代码
    const result = await generator.generateCode(
      apiData, 
      path.join(__dirname, 'output')
    );
    
    if (result.success) {
      console.log('\n✅ 代码生成成功！');
      console.log('📊 生成统计:');
      console.log(`   - 项目ID: ${result.data.metadata.pid}`);
      console.log(`   - 模块ID: ${result.data.metadata.cid}`);
      console.log(`   - API数量: ${result.data.metadata.apiCount}`);
      console.log(`   - 生成时间: ${result.data.metadata.generatedAt}`);
      
      console.log('\n📁 生成的文件:');
      console.log(`   - ${result.data.fileName}-api.js`);
      console.log(`   - ${result.data.fileName}-logic.js`);
    } else {
      console.error('❌ 生成失败:', result.error);
    }
  } catch (error) {
    console.error('❌ 运行出错:', error.message);
  }
}

// 运行演示
if (require.main === module) {
  runDemo();
}

module.exports = { apiData, runDemo };