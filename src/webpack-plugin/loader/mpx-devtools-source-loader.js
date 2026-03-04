const path = require("path");
const JSON5 = require("json5");
const MPX_DEVTOOLS_IMPORT_PREFIX = "";
module.exports = function (source) {
  const filePath = this.resourcePath;
  if (path.extname(filePath) !== ".mpx" || filePath.includes('node_modules')) {
    return source;
  }
  const relativePath = path.relative(process.cwd(), filePath);
  const dataSource = addMpxSrcPathData(source, relativePath);
  const computedSource = addMpxSrcPathComputed(dataSource, relativePath);
  const mixinSource = addMixinImport(computedSource,relativePath);
  return mixinSource;
};

function addMpxSrcPathComputed(source, relativePath) {
  // 如果已经注入，直接返回
  if (source.includes("__mpx_file_src__")) {
    return source;
  }

  // 查找 <script> 标签
  const scriptMatch = source.match(/(<script[^>]*>)([\s\S]*?)(<\/script>)/i);
  if (!scriptMatch) return source;

  let [fullScriptMatch, openTag, scriptContent, closeTag] = scriptMatch;

  // 仅对包含 createPage/createComponent 的脚本处理
  const createRegex = /(createPage|createComponent)\s*\(\s*\{/i;
  const createMatch = scriptContent.match(createRegex);
  if (!createMatch) return source;

  // 查找是否已有 computed
  const computedRegex = /(\s*)(computed\s*:\s*\{)(\s*)/i;
  const computedMatch = scriptContent.match(computedRegex);

  if (computedMatch) {
    // 在已有 computed 的开头注入属性
    const [fullComputedMatch, beforeComputed, computedDecl, afterOpen] =
      computedMatch;
    const injected = `${beforeComputed}${computedDecl}${afterOpen}\n      __mpx_file_src__() { return '${relativePath}'; },`;
    scriptContent = scriptContent.replace(computedRegex, injected);
  } else {
    // 没有 computed 的情况下，在 create 调用后添加 computed 字段
    const createCallMatch = createMatch[0];
    const replacement = `${createCallMatch}\n    computed: {\n      __mpx_file_src__() { return '${relativePath}'; }\n    },`;
    scriptContent = scriptContent.replace(createRegex, replacement);
  }

  return source.replace(
    fullScriptMatch,
    `${openTag}${scriptContent}${closeTag}`
  );
}

function addMpxSrcPathData(source, relativePath) {
  // 检查是否已经注入过，避免重复处理
  if (source.includes("__mpx_file_src__")) {
    return source;
  }

  // 查找 <script> 标签
  const scriptMatch = source.match(/(<script[^>]*>)([\s\S]*?)(<\/script>)/i);
  if (!scriptMatch) {
    return source;
  }

  let [fullScriptMatch, openTag, scriptContent, closeTag] = scriptMatch;
  // filePath is available via outer scope if needed; don't create unused expressions

  // 查找 createPage 或 createComponent 调用
  const createRegex = /(createPage|createComponent)\s*\(\s*\{/i;
  const createMatch = scriptContent.match(createRegex);
  if (!createMatch) {
    return source;
  }

  // 查找现有的 data 属性（更精确的匹配）
  const dataRegex = /(\s*)(data\s*:\s*\{)(\s*)/;
  const dataMatch = scriptContent.match(dataRegex);

  if (dataMatch) {
    // 如果已经有 data 属性，在其开始处添加我们的属性
    const [fullDataMatch, beforeData, dataDecl, afterDataOpen] = dataMatch;
    const injectedProperty = `${beforeData}${dataDecl}${afterDataOpen}\n      __mpx_file_src__: '${relativePath}',`;

    scriptContent = scriptContent.replace(dataRegex, injectedProperty);
  } else {
    // 如果没有 data 属性，在 create 函数调用后添加
    const createCallMatch = createMatch[0];
    const replacement = `${createCallMatch}\n    data: {\n      __mpx_file_src__: '${relativePath}'\n    },`;

    scriptContent = scriptContent.replace(createRegex, replacement);
  }

  // 重新组装完整的源代码
  return source.replace(
    fullScriptMatch,
    `${openTag}${scriptContent}${closeTag}`
  );
}

function addMixinImport(source, relativePath) {
  // app.mpx 不需要注入 mixin
  const isApp = relativePath.endsWith("app.mpx");
  if (isApp) {
    return source;
  }
  
  // 检测是页面还是组件
  const isPage = /createPage\s*\(/i.test(source);
  const isComponent = /createComponent\s*\(/i.test(source);
  
  let mixinImportStr = '';
  
  if (isPage) {
    // 页面：导入并混入页面 mixin
    mixinImportStr = `
  import ___mpx from '@mpxjs/core'
  import mpxDevToolsPageMixin from "${MPX_DEVTOOLS_IMPORT_PREFIX}mpx-devtools/src/mixin/mixin-page.js";
  ___mpx.mixin(mpxDevToolsPageMixin)
    `;
  } else if (isComponent) {
    // 组件：导入并混入组件 mixin
    mixinImportStr = `
  import ___mpx from '@mpxjs/core'
  import mpxDevToolsComponentMixin from "${MPX_DEVTOOLS_IMPORT_PREFIX}mpx-devtools/src/mixin/mixin-component.js";
  ___mpx.mixin(mpxDevToolsComponentMixin)
    `;
  }
  
  // 如果有 mixin 需要注入，则注入
  if (mixinImportStr) {
    return source.replace("<script>", `<script>\n${mixinImportStr}\n`);
  }
  
  return source;
}
