const path = require('path')

/**
 * MPX 文件源码路径数据注入 loader
 * 在每个 MPX 组件的 data 属性中注入当前文件的源码路径
 * 注入的属性名为 __mpx_file_src__
 */
module.exports = function(source) {
  const filePath = this.resourcePath
  const relativePath = path.relative(process.cwd(), filePath)
  
  // 只处理 .mpx 文件
  if (path.extname(filePath) !== '.mpx') {
    return source
  }
  
  // 检查是否已经注入过，避免重复处理
  if (source.includes('__mpx_file_src__')) {
    return source
  }
  
  // 查找 <script> 标签
  const scriptMatch = source.match(/(<script[^>]*>)([\s\S]*?)(<\/script>)/i)
  if (!scriptMatch) {
    return source
  }
  
  let [fullScriptMatch, openTag, scriptContent, closeTag] = scriptMatch
  
  // 查找 createPage 或 createComponent 调用
  const createRegex = /(createPage|createComponent|createStore)\s*\(\s*\{/i
  const createMatch = scriptContent.match(createRegex)
  if (!createMatch) {
    return source
  }
  
  // 查找现有的 data 属性（更精确的匹配）
  const dataRegex = /(\s*)(data\s*:\s*\{)(\s*)/
  const dataMatch = scriptContent.match(dataRegex)
  
  if (dataMatch) {
    // 如果已经有 data 属性，在其开始处添加我们的属性
    const [fullDataMatch, beforeData, dataDecl, afterDataOpen] = dataMatch
    const injectedProperty = `${beforeData}${dataDecl}${afterDataOpen}\n      __mpx_file_src__: '${relativePath}',`
    
    scriptContent = scriptContent.replace(dataRegex, injectedProperty)
  } else {
    // 如果没有 data 属性，在 create 函数调用后添加
    const createCallMatch = createMatch[0]
    const replacement = `${createCallMatch}\n    data: {\n      __mpx_file_src__: '${relativePath}'\n    },`
    
    scriptContent = scriptContent.replace(createRegex, replacement)
  }
  
  // 重新组装完整的源代码
  return source.replace(fullScriptMatch, `${openTag}${scriptContent}${closeTag}`)
}
