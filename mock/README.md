# Mock API 使用说明

## 文件说明

- `mock-data.json`: Mock数据
- `mock-api.js`: Mock API方法
- `mock-server.js`: Mock服务器

## 使用方式

### 1. 直接使用Mock方法

```javascript
import { getUsers, createUser, getUserById } from './mock-api.js';

// 获取用户列表
const users = await getUsers();
console.log(users);

// 创建用户
const newUser = await createUser({ name: '张三', email: 'zhangsan@example.com' });
console.log(newUser);
```

### 2. 启动Mock服务器

```bash
# 安装依赖
npm install express cors

# 启动服务器
node mock/mock-server.js
```

服务器将在 http://localhost:3001 启动

### 3. API端点

- GET /users - 获取用户列表
- POST /users - 创建用户
- GET /users/:id - 获取用户详情
- PUT /users/:id - 更新用户
- DELETE /users/:id - 删除用户

## 自定义Mock数据

您可以直接编辑 `mock-data.json` 文件来自定义Mock数据。
