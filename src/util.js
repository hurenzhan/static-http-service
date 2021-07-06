const fs = require('fs').promises;

// 模板引擎的实现原理  with + new Function,  WEBPACK loader 最终原理都是字符串拼接

/**
 * @name 模板引擎
 * @description 根据模板字符串渲染成标准html格式
 * @param {String} template
 * @param {*} data
 * @return {String}
 */
async function render(template, data) {
  let templateStr = `let str = ''\r\n`;  // 初始化拼接
  templateStr += 'with(obj){';
  templateStr += 'str +=`';
  // 将标识符号去掉去 => ${ xx }（?标识非贪婪，避免<%=xx%><%=xx%> => =xx%><%=xx）
  template = template.replace(/<%=(.*?)%>/g, (...arguments) => {
    return '${' + arguments[1] + '}'
  })
  templateStr += template.replace(/<%(.*?)%>/g, (...arguments) => {
    return '`\r\n' + arguments[1] + '\r\nstr +=`'
  })
  templateStr += '`\r\n return str \r\n}';
  const fn = new Function('obj', templateStr);
  return fn(data);
}

/**
 * @name 模板引擎（路径）
 * @description 根据模板路径渲染成标准html格式
 * @param {String} filePath
 * @param {*} data
 * @return {String}
 */
async function renderFile(filePath, data) {
  let template = await fs.readFile(filePath, 'utf8');  // 获取模板
  return render(template, data);
}


exports.renderFile = renderFile;
exports.render = render;
