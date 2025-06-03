class NamingUtils {
  /**
   * 生成文件名
   */
  generateFileName(pid, cid) {
    return `${pid}-${cid}`;
  }

  /**
   * 生成API方法名
   */
  generateApiMethodName(pid, cid, api) {
    const pathPart = this.pathToMethodName(api.path);
    const methodPart = api.method.toLowerCase();
    return `${pid}${this.capitalize(cid)}Api${this.capitalize(methodPart)}${pathPart}`;
  }

  /**
   * 生成逻辑方法名
   */
  generateLogicMethodName(pid, cid, api) {
    const pathPart = this.pathToMethodName(api.path);
    const methodPart = api.method.toLowerCase();
    return `${pid}${this.capitalize(cid)}${this.capitalize(methodPart)}${pathPart}`;
  }

  /**
   * 将路径转换为方法名部分
   */
  pathToMethodName(path) {
    return path
      .split('/')
      .filter(part => part && !part.startsWith(':'))
      .map(part => this.capitalize(part))
      .join('');
  }

  /**
   * 首字母大写
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * 驼峰命名
   */
  toCamelCase(str) {
    return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase());
  }
}

module.exports = NamingUtils;