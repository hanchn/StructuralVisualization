
# 前端接口代码生成器 (Frontend API Code Generator)

## 产品概述

前端接口代码生成器是一个基于后端API数据自动生成前端接口代码的工具，旨在提高前端开发效率，减少重复性工作，确保接口调用的一致性和可维护性。

### 核心价值

- **自动化生成**：基于后端API文档自动生成前端接口代码
- **增量更新**：支持AST方式的智能增量更新，避免覆盖自定义修改
- **模块化设计**：将接口封装和业务逻辑分离，提高代码可维护性
- **Mock支持**：内置Mock模式，支持前后端并行开发
- **多项目管理**：基于项目ID和模块ID的命名规范，避免命名冲突

## 产品特性

### 🚀 智能代码生成
- 基于API文档自动生成接口封装代码
- 支持多种前端框架（React、Vue、Angular等）
- 自动生成TypeScript类型定义
- 统一的错误处理和响应格式

### 🔄 增量更新机制
- AST语法树分析，识别代码变更
- 智能判断是否覆盖或增量更新
- 保护开发者的自定义修改
- 版本控制友好的更新策略

### 📁 模块化架构
- **接口层**：纯粹的API调用封装
- **逻辑层**：业务逻辑和数据处理
- 基于项目ID(pid)和模块ID(cid)的文件组织
- 清晰的依赖关系和调用链路

### 🎭 Mock模式
- 内置Mock数据生成
- 支持动态Mock服务器
- 前后端并行开发支持
- 真实API和Mock数据无缝切换

## 架构设计

### 整体架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API文档输入    │───▶│   代码生成引擎   │───▶│   输出文件管理   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   配置管理器     │    │   AST分析器     │    │   文件写入器     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mock生成器     │    │   命名生成器     │    │   模板引擎      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 核心模块

#### 1. 代码生成引擎 (CodeGenerator)
- **职责**：协调整个代码生成流程
- **功能**：
  - 解析API文档
  - 调用各个子模块
  - 管理生成流程

#### 2. AST分析器 (ASTAnalyzer)
- **职责**：分析现有代码结构，实现增量更新
- **功能**：
  - 解析现有代码的AST
  - 识别代码变更
  - 决定更新策略

#### 3. 命名生成器 (NamingGenerator)
- **职责**：生成标准化的文件名和方法名
- **规则**：
  - 文件命名：`{pid}-{cid}-api.js` / `{pid}-{cid}-logic.js`
  - 接口命名：`{pid}{cid}Api{路径}`
  - 逻辑命名：`{pid}{cid}{简写}`

#### 4. 模板引擎 (TemplateEngine)
- **职责**：基于模板生成代码
- **支持**：
  - 多种前端框架模板
  - 自定义模板扩展
  - 动态模板渲染

#### 5. Mock生成器 (MockGenerator)
- **职责**：生成Mock数据和Mock服务
- **功能**：
  - 基于API Schema生成Mock数据
  - 启动Mock服务器
  - 管理Mock配置

### 文件组织结构

```
project/
├── output/
│   ├── api/                    # 接口封装层
│   │   ├── {pid}-{cid}-api.js
│   │   └── ...
│   ├── logic/                  # 业务逻辑层
│   │   ├── {pid}-{cid}-logic.js
│   │   └── ...
│   └── types/                  # TypeScript类型定义
│       ├── {pid}-{cid}-types.ts
│       └── ...
├── config/
│   ├── generator.config.js     # 生成器配置
│   ├── naming.config.js        # 命名规则配置
│   └── template.config.js      # 模板配置
├── templates/
│   ├── api/                    # API模板
│   ├── logic/                  # 逻辑模板
│   └── types/                  # 类型模板
└── mock/
    ├── data/                   # Mock数据
    └── server/                 # Mock服务器
```

### 命名规范

#### 文件命名
- **API文件**：`{pid}-{cid}-api.js`
- **逻辑文件**：`{pid}-{cid}-logic.js`
- **类型文件**：`{pid}-{cid}-types.ts`

#### 方法命名
- **接口方法**：`{pid}{cid}Api{路径转驼峰}`
  - 示例：`p001C001ApiUserLogin`
- **逻辑方法**：`{pid}{cid}{功能简写}`
  - 示例：`p001C001Login`

### 数据流设计

```
API文档 ──┐
          ├─▶ 解析器 ──▶ 代码生成器 ──┐
配置文件 ──┘                        ├─▶ 文件输出
AST分析 ────────────────────────────┘
```

## 技术栈

- **核心语言**：Node.js / JavaScript
- **AST解析**：@babel/parser, @babel/traverse
- **模板引擎**：Handlebars / EJS
- **配置管理**：JSON / YAML
- **Mock服务**：Express.js
- **类型支持**：TypeScript

## 使用场景

### 1. 新项目开发
- 基于API文档快速生成接口代码
- 建立标准化的接口调用规范
- 提供Mock数据支持前端开发

### 2. 现有项目维护
- 增量更新API接口
- 保持接口代码与后端同步
- 重构和优化接口调用

### 3. 团队协作
- 统一接口调用标准
- 减少接口对接沟通成本
- 提高代码质量和一致性

## 配置示例

### 生成器配置 (generator.config.js)
```javascript
module.exports = {
  // 项目配置
  project: {
    pid: 'p001',
    name: 'UserManagement'
  },
  
  // 输出配置
  output: {
    apiDir: './output/api',
    logicDir: './output/logic',
    typesDir: './output/types'
  },
  
  // 模板配置
  templates: {
    framework: 'react', // react, vue, angular
    language: 'typescript', // javascript, typescript
    style: 'async-await' // promise, async-await
  },
  
  // Mock配置
  mock: {
    enabled: true,
    port: 3001,
    dataDir: './mock/data'
  }
};
```

## 快速开始

### 安装
```bash
npm install frontend-api-generator
```

### 基本使用
```bash
# 生成API代码
npx api-generator generate --config ./config/generator.config.js

# 启动Mock服务
npx api-generator mock --port 3001

# 增量更新
npx api-generator update --incremental
```

### 编程接口
```javascript
const { APIGenerator } = require('frontend-api-generator');

const generator = new APIGenerator({
  configPath: './config/generator.config.js'
});

// 生成代码
await generator.generate();

// 启动Mock服务
await generator.startMockServer();
```

## 路线图

### v1.0 (当前版本)
- [x] 基础代码生成功能
- [x] AST增量更新
- [x] Mock模式支持
- [x] 模块化文件组织

### v1.1 (计划中)
- [ ] 图形化配置界面
- [ ] 更多前端框架支持
- [ ] 插件系统
- [ ] 性能优化

### v2.0 (未来版本)
- [ ] 可视化API管理
- [ ] 团队协作功能
- [ ] 云端配置同步
- [ ] AI辅助代码生成

## 贡献指南

我们欢迎社区贡献！请查看 了解如何参与项目开发。

## 许可证

MIT License - 详见  文件。

---

**让前端接口开发更简单、更高效！** 🚀
        