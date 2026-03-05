/**
 * MPX DevTools Page Mixin
 * 页面专用混入，监听页面的挂载和卸载
 */

import mpxDevTools from '../mpx-devtools.js'

export const mpxDevToolsPageMixin = {
  onLoad(options) {
    mpxDevTools.onComponentMounted(this)
    // 获取页面参数，初始化数据
  },
  
  onShow() {
    mpxDevTools.onComponentMounted(this)
  },
  
  onHide() {
    mpxDevTools.onComponentUnmounted(this)
  },
  
  onReady() {
    mpxDevTools.onComponentMounted(this)
  },
  
  onUnload() {
    mpxDevTools.onComponentUnmounted(this)
    // 清理资源
  },
}

export default mpxDevToolsPageMixin
