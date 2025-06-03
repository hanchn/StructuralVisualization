// Mock服务器 - 自动生成
// 生成时间: 2025-06-03T03:26:35.650Z

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API路由
  // 获取用户列表
  app.get('/users', (req, res) => {
    setTimeout(() => {
      res.json({
      "code": 147,
      "message": "李四",
      "data": {
            "list": [
                  {
                        "id": 161,
                        "name": "王五",
                        "email": "user1055@example.com",
                        "age": 634,
                        "status": "李四",
                        "createdAt": "2025-06-03T03:26:35.650Z"
                  },
                  {
                        "id": 106,
                        "name": "王五",
                        "email": "user7411@example.com",
                        "age": 704,
                        "status": "孙八",
                        "createdAt": "2025-06-03T03:26:35.650Z"
                  },
                  {
                        "id": 377,
                        "name": "赵六",
                        "email": "user92@example.com",
                        "age": 143,
                        "status": "李四",
                        "createdAt": "2025-06-03T03:26:35.650Z"
                  },
                  {
                        "id": 941,
                        "name": "孙八",
                        "email": "user4851@example.com",
                        "age": 793,
                        "status": "赵六",
                        "createdAt": "2025-06-03T03:26:35.650Z"
                  },
                  {
                        "id": 703,
                        "name": "王五",
                        "email": "user7355@example.com",
                        "age": 866,
                        "status": "赵六",
                        "createdAt": "2025-06-03T03:26:35.650Z"
                  }
            ],
            "total": 423,
            "page": 229,
            "size": 199
      }
});
    }, 200);
  });

  // 创建用户
  app.post('/users', (req, res) => {
    setTimeout(() => {
      res.json({
      "code": 200,
      "message": "success",
      "data": {
            "id": 3906,
            "name": "李四",
            "timestamp": "2025-06-03T03:26:35.650Z"
      }
});
    }, 200);
  });

  // 获取用户详情
  app.get('/users/:id', (req, res) => {
    setTimeout(() => {
      res.json({
      "code": 942,
      "message": "钱七",
      "data": {
            "id": 379,
            "name": "吴十",
            "email": "李四",
            "age": 736,
            "status": "李四",
            "createdAt": "2025-06-03T03:26:35.650Z"
      }
});
    }, 200);
  });

  // 更新用户
  app.put('/users/:id', (req, res) => {
    setTimeout(() => {
      res.json({
      "code": 13,
      "message": "赵六",
      "data": {
            "id": 900,
            "name": "李四",
            "email": "周九",
            "age": 469,
            "status": "王五",
            "updatedAt": "2025-06-03T03:26:35.650Z"
      }
});
    }, 200);
  });

  // 删除用户
  app.delete('/users/:id', (req, res) => {
    setTimeout(() => {
      res.json({
      "code": 991,
      "message": "王五"
});
    }, 200);
  });

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
  console.log(`🚀 Mock服务器启动成功!`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log(`📝 API文档: http://localhost:${PORT}/docs`);
});

export default app;