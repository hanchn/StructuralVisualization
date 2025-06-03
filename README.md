# 基于AST的轻量化数据转换器设计

## API代码生成器

一个轻量级的工具，可以从Swagger/OpenAPI或YApi文档自动生成前端API调用代码。

### 特性

- 🚀 轻量级：核心代码不到10KB
- 🔧 支持多种格式：Swagger/OpenAPI 3.0、YApi
- 📦 支持多种HTTP客户端：fetch、axios
- 🎯 支持TypeScript
- ⚡ 基于AST，性能优异
- 🔌 可扩展的插件架构

### 快速开始

```javascript
import { APICodeGenerator } from './src/index.js';

// 创建生成器实例
const generator = new APICodeGenerator({
  httpClient: 'axios', // 或 'fetch'
  typescript: true,    // 是否生成TypeScript代码
  baseURL: 'https://api.example.com'
});

// 从Swagger文档生成代码
const code = generator.generate(swaggerDoc, 'swagger');
console.log(code);
```

## AST方案的优势

### 1. 性能优势
- **编译时优化**: AST在编译时就确定了转换逻辑，运行时开销极小
- **内存效率**: 不需要加载大量模板文件，内存占用更少
- **执行速度**: 直接操作语法树，避免了字符串解析的开销

### 2. 灵活性
- **精确控制**: 可以精确控制生成代码的每个节点
- **类型安全**: 在AST层面就能保证生成代码的语法正确性
- **易于扩展**: 添加新的转换规则只需要扩展AST节点处理器

## 轻量化架构设计

```
数据输入 → AST解析器 → 转换规则引擎 → 代码生成器 → 输出
   ↓           ↓            ↓            ↓         ↓
 JSON/XML   数据AST    转换AST      目标AST    JS/HTML
```

### 核心模块（轻量化）

#### 1. AST解析器 (Parser)
```javascript
// 数据解析为AST
class DataParser {
  parseJSON(data) {
    return this.buildAST(JSON.parse(data));
  }
  
  buildAST(obj, type = 'object') {
    return {
      type,
      value: obj,
      children: this.getChildren(obj)
    };
  }
}
```

#### 2. 转换规则引擎 (Transformer)
```javascript
// 轻量级转换规则
class ASTTransformer {
  constructor(rules) {
    this.rules = rules; // 转换规则配置
  }
  
  transform(dataAST, targetType) {
    return this.applyRules(dataAST, this.rules[targetType]);
  }
}
```

#### 3. 代码生成器 (Generator)
```javascript
// 从AST生成目标代码
class CodeGenerator {
  generateJS(ast) {
    return this.traverse(ast, this.jsVisitors);
  }
  
  generateHTML(ast) {
    return this.traverse(ast, this.htmlVisitors);
  }
}
```

## 轻量化实现方案

### 项目结构（精简版）
```
StructuralVisualization/
├── src/
│   ├── core/
│   │   ├── parser.js      # AST解析器 (~2KB)
│   │   ├── transformer.js # 转换引擎 (~3KB)
│   │   └── generator.js   # 代码生成器 (~4KB)
│   ├── rules/             # 转换规则配置
│   │   ├── js-rules.json  # JS转换规则
│   │   └── html-rules.json # HTML转换规则
│   └── index.js          # 主入口 (~1KB)
├── examples/             # 示例
└── package.json
```

### 核心API设计（极简）
```javascript
// 主要API - 只需要一个函数
const converter = new StructuralConverter();

// 使用方式
const result = converter.convert({
  data: jsonData,        // 输入数据
  target: 'js',         // 目标格式: 'js' | 'html'
  rules: customRules    // 可选：自定义规则
});
```

### 转换规则配置（声明式）
```json
{
  "js": {
    "object": "const {{name}} = {\n{{#each properties}}  {{key}}: {{value}},\n{{/each}}}",
    "array": "const {{name}} = [\n{{#each items}}  {{value}},\n{{/each}}]",
    "string": "'{{value}}'",
    "number": "{{value}}"
  },
  "html": {
    "object": "<div class=\"object\">\n{{#each properties}}<div>{{key}}: {{value}}</div>\n{{/each}}</div>",
    "array": "<ul>\n{{#each items}}<li>{{value}}</li>\n{{/each}}</ul>"
  }
}
```

## 性能对比

| 方案 | 包大小 | 内存占用 | 转换速度 | 扩展性 |
|------|--------|----------|----------|--------|
| 传统模板 | ~50KB | 高 | 中等 | 中等 |
| **AST方案** | **~10KB** | **低** | **快** | **高** |

## 实现优先级

### Phase 1: 核心功能（1-2天）
1. 基础AST解析器
2. 简单的JS/HTML生成器
3. 基本转换规则

### Phase 2: 优化增强（2-3天）
1. 规则配置系统
2. 错误处理
3. 性能优化

### Phase 3: 扩展功能（按需）
1. CLI工具
2. Web界面
3. 插件系统

## 技术选型（轻量化）

- **核心**: 纯JavaScript（无依赖）
- **解析**: 自实现轻量AST解析器
- **配置**: JSON格式规则文件
- **构建**: 简单的rollup打包
- **测试**: 轻量级测试框架
