/**
 * 数据映射器 - 统一不同平台的数据格式
 */
export class DataMapper {
  constructor(options = {}) {
    this.platform = options.platform || 'standard'; // standard, wechat, alipay, etc.
    this.mappingRules = this.initMappingRules();
  }

  /**
   * 初始化映射规则
   */
  initMappingRules() {
    return {
      standard: {
        success: 'data',
        error: 'error',
        code: 'code',
        message: 'message'
      },
      wechat: {
        success: 'data',
        error: 'errMsg',
        code: 'errCode',
        message: 'errMsg'
      },
      alipay: {
        success: 'data',
        error: 'error',
        code: 'resultCode',
        message: 'resultMsg'
      }
    };
  }

  /**
   * 映射响应数据结构
   */
  mapResponse(schema) {
    const rules = this.mappingRules[this.platform];
    
    return {
      type: 'object',
      properties: {
        [rules.code]: { type: 'number', example: 200 },
        [rules.message]: { type: 'string', example: 'success' },
        [rules.success]: schema || { type: 'object' }
      }
    };
  }
}