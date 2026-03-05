/**
 * MPX DevTools Page Mixin
 * 页面专用混入，监听页面的挂载和卸载
 */

import mpxDevTools from '../mpx-devtools.js'

export const mpxDevToolsPageMixin = {
  // 小程序页面生命周期
  onShow() {
    try {
      // 页面加载完成，当作挂载处理
      mpxDevTools.onComponentMounted(this)
      debugger
    } catch (error) {
      console.error('[mpxDevTools] Error in page onLoad hook:', error)
    }
  },

  onHide() {
    try {
      // 页面卸载
      mpxDevTools.onComponentUnmounted(this)
      debugger

    } catch (error) {
      console.error('[mpxDevTools] Error in page onUnload hook:', error)
    }
  }
}

export default mpxDevToolsPageMixin
