/**
 * MPX DevTools Component Mixin
 * 组件专用混入，监听组件的挂载和卸载
 */

import mpxDevTools from '../mpx-devtools.js'

export const mpxDevToolsComponentMixin = {
  // 小程序原生组件生命周期（最优先，兼容性最好）
    pageLifetimes: {
    // 在组件中监听页面生命周期
    show() {
      mpxDevTools.onComponentMounted(this)

    },
  
    hide() {
      mpxDevTools.onComponentUnmounted(this)
    }
  },
  attached() {
    try {
      mpxDevTools.onComponentMounted(this)
    } catch (error) {
      console.error('[mpxDevTools] Error in component attached hook:', error)
    }
  },

  detached() {
    try {
      mpxDevTools.onComponentUnmounted(this)
    } catch (error) {
      console.error('[mpxDevTools] Error in component detached hook:', error)
    }
  },

}

export default mpxDevToolsComponentMixin

