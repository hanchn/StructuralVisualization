const ApiTemplate = require('../templates/api-template');
const LogicTemplate = require('../templates/logic-template');
const NamingUtils = require('../utils/naming');

class CodeGenerator {
  constructor() {
    this.apiTemplate = new ApiTemplate();
    this.logicTemplate = new LogicTemplate();
    this.namingUtils = new NamingUtils();
  }

  /**
   * 生成完整的代码
   * @param {Object} parsedData - 解析后的API数据
   * @returns {Object} 生成的代码
   */
  generate(parsedData) {
    const { pid, cid, baseUrl, apis } = parsedData;
    
    // 生成文件名
    const fileName = this.namingUtils.generateFileName(pid, cid);
    
    // 生成API代码
    const apiCode = this.generateApiCode(parsedData);
    
    // 生成逻辑代码
    const logicCode = this.generateLogicCode(parsedData);
    
    return {
      fileName,
      apiCode,
      logicCode,
      metadata: {
        pid,
        cid,
        baseUrl,
        apiCount: apis.length,
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * 生成API接口代码
   */
  generateApiCode(parsedData) {
    const { pid, cid, baseUrl, apis } = parsedData;
    
    // 生成导入和基础设置
    let code = this.apiTemplate.generateHeader(baseUrl);
    
    // 为每个API生成方法
    apis.forEach(api => {
      const methodName = this.namingUtils.generateApiMethodName(pid, cid, api);
      const methodCode = this.apiTemplate.generateMethod(api, methodName);
      code += '\n' + methodCode;
    });
    
    // 生成导出
    const exportNames = apis.map(api => 
      this.namingUtils.generateApiMethodName(pid, cid, api)
    );
    code += '\n' + this.apiTemplate.generateExports(exportNames);
    
    return code;
  }

  /**
   * 生成逻辑处理代码
   */
  generateLogicCode(parsedData) {
    const { pid, cid, apis } = parsedData;
    const fileName = this.namingUtils.generateFileName(pid, cid);
    
    // 生成导入
    const apiMethodNames = apis.map(api => 
      this.namingUtils.generateApiMethodName(pid, cid, api)
    );
    let code = this.logicTemplate.generateHeader(fileName, apiMethodNames);
    
    // 为每个API生成逻辑方法
    apis.forEach(api => {
      const apiMethodName = this.namingUtils.generateApiMethodName(pid, cid, api);
      const logicMethodName = this.namingUtils.generateLogicMethodName(pid, cid, api);
      const methodCode = this.logicTemplate.generateMethod(api, apiMethodName, logicMethodName);
      code += '\n' + methodCode;
    });
    
    // 生成导出
    const exportNames = apis.map(api => 
      this.namingUtils.generateLogicMethodName(pid, cid, api)
    );
    code += '\n' + this.logicTemplate.generateExports(exportNames);
    
    return code;
  }
}

module.exports = CodeGenerator;