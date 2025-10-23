const path = require("path");
const JSON5 = require("json5");
const MPX_DEVTOOLS_IMPORT_PREFIX = "";
module.exports = function (source) {
  const filePath = this.resourcePath;
  if (path.extname(filePath) !== ".mpx") {
    return source;
  }
  if (filePath.includes("mpx-devtools") || filePath.includes('node_modules')) {
    return source;
  }
  const relativePath = path.relative(process.cwd(), filePath);
  const dataSource = addMpxSrcPathData(source, relativePath);
  const computedSource = addMpxSrcPathComputed(dataSource, relativePath);
  const mixinSource = addMixinImport(computedSource,relativePath);
  const addMpxDevtoolsTagSource = addMpxDevtoolsTag(mixinSource, relativePath);
  return addMpxDevtoolsTagSource;
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

  // 仅对包含 createPage/createComponent/createStore 的脚本处理
  const createRegex = /(createPage|createComponent|createStore)\s*\(\s*\{/i;
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
  const createRegex = /(createPage|createComponent|createStore)\s*\(\s*\{/i;
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

function addMpxDevtoolsTag(source) {
  const importPath = `${MPX_DEVTOOLS_IMPORT_PREFIX}mpx-devtools/src/mpx-devtools.mpx`;
  const devtoolsTag = `<mpx-devtools />`;
  // 仅在包含 createPage 的文件中注入（page 组件）
  const scriptMatch = source.match(/(<script[^>]*>)([\s\S]*?)(<\/script>)/i);
  if (!scriptMatch) return source;

  const scriptContent = scriptMatch[2];
  const isPage = /createPage\s*\(/i.test(scriptContent);
  if (!isPage) return source;

  let modified = source;

  // 处理 <script type="application/json"> 中的 usingComponents
  const jsonScriptRegex =
    /<script\s+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/i;
  const jsonMatch = modified.match(jsonScriptRegex);
  if (jsonMatch) {
    // 已有 application/json 脚本，解析并修改 usingComponents
    let jsonContent = jsonMatch[1];
    try {
      // 使用 json5 解析以支持注释和尾随逗号
      const parsed = JSON5.parse(jsonContent);
      parsed.usingComponents = parsed.usingComponents || {};
      if (!parsed.usingComponents["mpx-devtools"]) {
        parsed.usingComponents["mpx-devtools"] = importPath;
        const newJson = JSON.stringify(parsed, null, 2);
        modified = modified.replace(
          jsonScriptRegex,
          `<script type="application/json">\n${newJson}\n</script>`
        );
      }
    } catch (e) {
      // 无法解析为严格 JSON 时，使用文本替换的保守方式处理 usingComponents
      const usingCompRegex = /("usingComponents"\s*:\s*\{)([\s\S]*?)(\})/i;
      const ucMatch = jsonContent.match(usingCompRegex);
      if (ucMatch) {
        const whole = ucMatch[0];
        const body = ucMatch[2];
        if (!/mpx-devtools\s*"\s*:/i.test(body)) {
          const newBody = body.trim()
            ? body.replace(/\}\s*$/, "") +
              `,\n    "mpx-devtools": "${importPath}"\n  `
            : `\n    "mpx-devtools": "${importPath}"\n  `;
          const newUsing = `"usingComponents": {${newBody}}`;
          modified = modified.replace(whole, newUsing);
        }
      } else {
        // 没有 usingComponents，插入一个（直接替换整个 json 脚本内容）
        const newJsonText = `{\n  "usingComponents": {\n    "mpx-devtools": "${importPath}"\n  }\n}`;
        modified = modified.replace(
          jsonScriptRegex,
          `<script type="application/json">\n${newJsonText}\n</script>`
        );
      }
    }
  } else {
    // 没有 application/json 脚本，创建一个并插入到文件末尾（在 </template> 之后）
    const jsonText = `<script type="application/json">\n{\n  "usingComponents": {\n    "mpx-devtools": "${importPath}"\n  }\n}\n</script>`;
    // 尝试把它放在 template 之后或文件末尾
    const templateClose = modified.match(/<\/template>/i);
    if (templateClose) {
      const idx = modified.indexOf(templateClose[0]) + templateClose[0].length;
      modified = modified.slice(0, idx) + "\n" + jsonText + modified.slice(idx);
    } else {
      modified = modified + "\n" + jsonText;
    }
  }

  // 在 template 中加入 <mpx-devtools />，避免重复注入
  const templateRegex = /(<template[^>]*>)([\s\S]*?)(<\/template>)/i;
  const tMatch = modified.match(templateRegex);
  if (tMatch) {
    const [full, openTag, tplContent, closeTag] = tMatch;
    if (!/mpx-devtools\s*\/>/i.test(tplContent)) {
      // 将 devtools 标签追加到 template 的末尾（刚好在 </template> 前）
      const newTpl = `${openTag}${tplContent}\n  ${devtoolsTag}${closeTag}`;
      modified = modified.replace(full, newTpl);
    }
  }

  return modified;
}

function addMixinImport(source, relativePath) {
  const str = ` 
  import ___mpx from '@mpxjs/core'
  import mpxDevToolsMixin from "${MPX_DEVTOOLS_IMPORT_PREFIX}mpx-devtools/src/mixin/mpx-devtools-mixin.js";
  ___mpx.mixin(mpxDevToolsMixin)
    `;
  const isApp = relativePath.endsWith("app.mpx");
  if (isApp) {
    return source.replace("<script>", `<script>\n${str}\n`);
  }
  return source;
}
