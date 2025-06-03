#!/usr/bin/env node
/**
 * Mock服务器启动脚本
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const mockServerPath = path.join(rootDir, 'mock', 'mock-server.js');

// 检查Mock服务器文件是否存在
if (!fs.existsSync(mockServerPath)) {
  console.log('❌ Mock服务器文件不存在!');
  console.log('请先运行: npm run mock');
  process.exit(1);
}

// 检查依赖是否安装
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

if (!dependencies.express || !dependencies.cors) {
  console.log('❌ 缺少必要依赖!');
  console.log('请运行: npm install express cors');
  process.exit(1);
}

console.log('🚀 启动Mock服务器...');

// 启动Mock服务器
const child = spawn('node', [mockServerPath], {
  stdio: 'inherit',
  cwd: rootDir
});

child.on('error', (error) => {
  console.error('❌ 启动失败:', error.message);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Mock服务器异常退出，退出码: ${code}`);
  }
});

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n👋 正在关闭Mock服务器...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});