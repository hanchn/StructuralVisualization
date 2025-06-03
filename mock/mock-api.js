// Mock API 代码 - 自动生成
// 生成时间: 2025-06-03T03:26:35.650Z

/**
 * 获取用户列表 (Mock)
 */
export async function getUsers(...args) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 返回mock数据
  return {
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
};
}

/**
 * 创建用户 (Mock)
 */
export async function createUser(...args) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 返回mock数据
  return {
  "code": 200,
  "message": "success",
  "data": {
    "id": 3906,
    "name": "李四",
    "timestamp": "2025-06-03T03:26:35.650Z"
  }
};
}

/**
 * 获取用户详情 (Mock)
 */
export async function getUserById(...args) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 返回mock数据
  return {
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
};
}

/**
 * 更新用户 (Mock)
 */
export async function updateUser(...args) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 返回mock数据
  return {
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
};
}

/**
 * 删除用户 (Mock)
 */
export async function deleteUser(...args) {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 返回mock数据
  return {
  "code": 991,
  "message": "王五"
};
}

// 导出所有Mock方法
export { getUsers, createUser, getUserById, updateUser, deleteUser };

// 默认导出
export default { getUsers, createUser, getUserById, updateUser, deleteUser };