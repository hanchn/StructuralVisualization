/**
 * API文档AST解析器
 * 支持Swagger和YApi格式
 */
export class APIParser {
  constructor() {
    this.supportedFormats = ['swagger', 'yapi', 'openapi'];
  }

  /**
   * 解析API文档为AST
   * @param {Object} apiDoc - API文档对象
   * @param {string} format - 文档格式 (swagger/yapi/openapi)
   * @returns {Object} AST对象
   */
  parse(apiDoc, format = 'swagger') {
    const normalizedDoc = this.normalizeDocument(apiDoc, format);
    return this.buildAST(normalizedDoc);
  }

  /**
   * 标准化不同格式的API文档
   */
  normalizeDocument(doc, format) {
    switch (format.toLowerCase()) {
      case 'swagger':
      case 'openapi':
        return this.normalizeSwagger(doc);
      case 'yapi':
        return this.normalizeYApi(doc);
      default:
        throw new Error(`不支持的格式: ${format}`);
    }
  }

  /**
   * 标准化Swagger文档
   */
  normalizeSwagger(doc) {
    const apis = [];
    const paths = doc.paths || {};
    
    Object.entries(paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, config]) => {
        apis.push({
          path,
          method: method.toUpperCase(),
          operationId: config.operationId || this.generateOperationId(path, method),
          summary: config.summary || '',
          parameters: this.normalizeParameters(config.parameters || []),
          requestBody: this.normalizeRequestBody(config.requestBody),
          responses: this.normalizeResponses(config.responses || {}),
          tags: config.tags || []
        });
      });
    });

    return {
      info: doc.info || {},
      apis,
      components: doc.components || {}
    };
  }

  /**
   * 标准化YApi文档
   */
  normalizeYApi(doc) {
    const apis = (doc.list || []).map(api => ({
      path: api.path,
      method: api.method.toUpperCase(),
      operationId: api.title ? this.camelCase(api.title) : this.generateOperationId(api.path, api.method),
      summary: api.title || '',
      parameters: this.normalizeYApiParameters(api),
      requestBody: this.normalizeYApiRequestBody(api),
      responses: this.normalizeYApiResponses(api),
      tags: api.tag ? [api.tag] : []
    }));

    return {
      info: { title: doc.name || 'API', version: '1.0.0' },
      apis,
      components: {}
    };
  }

  /**
   * 构建AST
   */
  buildAST(normalizedDoc) {
    return {
      type: 'APIDocument',
      info: normalizedDoc.info,
      children: normalizedDoc.apis.map(api => this.buildAPINode(api)),
      components: normalizedDoc.components
    };
  }

  /**
   * 构建API节点
   */
  buildAPINode(api) {
    return {
      type: 'APIEndpoint',
      path: api.path,
      method: api.method,
      operationId: api.operationId,
      summary: api.summary,
      children: {
        parameters: this.buildParametersNode(api.parameters),
        requestBody: this.buildRequestBodyNode(api.requestBody),
        responses: this.buildResponsesNode(api.responses)
      },
      tags: api.tags
    };
  }

  /**
   * 构建参数节点
   */
  buildParametersNode(parameters) {
    return {
      type: 'Parameters',
      children: parameters.map(param => ({
        type: 'Parameter',
        name: param.name,
        in: param.in, // query, path, header, cookie
        required: param.required || false,
        schema: param.schema || { type: 'string' },
        description: param.description || ''
      }))
    };
  }

  /**
   * 构建请求体节点
   */
  buildRequestBodyNode(requestBody) {
    if (!requestBody) return null;
    
    return {
      type: 'RequestBody',
      required: requestBody.required || false,
      content: requestBody.content || {},
      description: requestBody.description || ''
    };
  }

  /**
   * 构建响应节点
   */
  buildResponsesNode(responses) {
    return {
      type: 'Responses',
      children: Object.entries(responses).map(([code, response]) => ({
        type: 'Response',
        statusCode: code,
        description: response.description || '',
        content: response.content || {},
        headers: response.headers || {}
      }))
    };
  }

  // 工具方法
  generateOperationId(path, method) {
    const cleanPath = path.replace(/[{}]/g, '').replace(/\//g, '_');
    return this.camelCase(`${method}_${cleanPath}`);
  }

  camelCase(str) {
    return str.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
  }

  normalizeParameters(params) {
    return params.map(param => ({
      name: param.name,
      in: param.in,
      required: param.required,
      schema: param.schema || { type: 'string' },
      description: param.description
    }));
  }

  normalizeRequestBody(requestBody) {
    if (!requestBody) return null;
    return {
      required: requestBody.required,
      content: requestBody.content,
      description: requestBody.description
    };
  }

  normalizeResponses(responses) {
    return responses;
  }

  normalizeYApiParameters(api) {
    const params = [];
    
    // 路径参数
    if (api.req_params) {
      api.req_params.forEach(param => {
        params.push({
          name: param.name,
          in: 'path',
          required: param.required === '1',
          schema: { type: 'string' },
          description: param.desc
        });
      });
    }
    
    // 查询参数
    if (api.req_query) {
      api.req_query.forEach(param => {
        params.push({
          name: param.name,
          in: 'query',
          required: param.required === '1',
          schema: { type: 'string' },
          description: param.desc
        });
      });
    }
    
    return params;
  }

  normalizeYApiRequestBody(api) {
    if (!api.req_body_other) return null;
    
    return {
      required: true,
      content: {
        'application/json': {
          schema: JSON.parse(api.req_body_other || '{}')
        }
      },
      description: '请求体'
    };
  }

  normalizeYApiResponses(api) {
    const responses = {};
    
    if (api.res_body) {
      responses['200'] = {
        description: '成功响应',
        content: {
          'application/json': {
            schema: JSON.parse(api.res_body || '{}')
          }
        }
      };
    }
    
    return responses;
  }
}