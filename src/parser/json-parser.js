class JsonParser {
  /**
   * 解析API数据
   * @param {Object} data - 原始API数据
   * @returns {Object} 解析后的数据
   */
  parse(data) {
    // 验证必需字段
    this.validateInput(data);
    
    return {
      pid: data.pid,
      cid: data.cid,
      baseUrl: data.baseUrl || '',
      apis: data.apis.map(api => this.parseApi(api))
    };
  }

  /**
   * 验证输入数据
   */
  validateInput(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid input: data must be an object');
    }
    
    if (!data.pid || !data.cid) {
      throw new Error('Missing required fields: pid and cid are required');
    }
    
    if (!Array.isArray(data.apis) || data.apis.length === 0) {
      throw new Error('Invalid apis: must be a non-empty array');
    }
  }

  /**
   * 解析单个API
   */
  parseApi(api) {
    // 验证API必需字段
    if (!api.path || !api.method) {
      throw new Error('API missing required fields: path and method are required');
    }
    
    return {
      name: api.name || this.generateApiName(api.path, api.method),
      path: api.path,
      method: api.method.toUpperCase(),
      pathParams: api.pathParams || this.extractPathParams(api.path),
      queryParams: api.queryParams || [],
      bodyParams: api.bodyParams || [],
      response: api.response || {},
      description: api.description || ''
    };
  }

  /**
   * 从路径中提取路径参数
   */
  extractPathParams(path) {
    const matches = path.match(/:([a-zA-Z_][a-zA-Z0-9_]*)/g);
    return matches ? matches.map(match => match.substring(1)) : [];
  }

  /**
   * 生成API名称
   */
  generateApiName(path, method) {
    // 移除路径参数，转换为驼峰命名
    const cleanPath = path
      .replace(/:[a-zA-Z_][a-zA-Z0-9_]*/g, 'ById')
      .replace(/\//g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');
    
    const pathParts = cleanPath.split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
    
    return method.toLowerCase() + pathParts;
  }
}

module.exports = JsonParser;