/**
 * MPX DevTools Mixin
 * 全局混入，用于监听所有组件的生命周期
 */

import mpxDevTools from './mpx-devtools.js'

export const mpxDevToolsMixin = {
  // 页面生命周期
  onShow() {
    // 页面显示时，当作组件挂载处理
    if (mpxDevTools && typeof mpxDevTools.onComponentMounted === 'function') {
      mpxDevTools.onComponentMounted(this)
    }
  },

  onHide() {
    // 页面隐藏时，当作组件卸载处理
    if (mpxDevTools && typeof mpxDevTools.onComponentUnmounted === 'function') {
      mpxDevTools.onComponentUnmounted(this)
    }
  },

  onUnload() {
    // 页面卸载时，确保组件被移除
    if (mpxDevTools && typeof mpxDevTools.onComponentUnmounted === 'function') {
      mpxDevTools.onComponentUnmounted(this)
    }
  },

  // 组件生命周期
  attached() {
    // 组件挂载
    if (mpxDevTools && typeof mpxDevTools.onComponentMounted === 'function') {
      mpxDevTools.onComponentMounted(this)
    }
  },

  detached() {
    // 组件卸载
    if (mpxDevTools && typeof mpxDevTools.onComponentUnmounted === 'function') {
      mpxDevTools.onComponentUnmounted(this)
    }
  },

  // MPX 生命周期
  beforeMount() {
    // 即将挂载
    this._mpxDevToolsBeforeMount = Date.now()
  },

  mounted() {
    // 挂载完成
    if (mpxDevTools && typeof mpxDevTools.onComponentMounted === 'function') {
      mpxDevTools.onComponentMounted(this)
    }
  },


  unmounted() {
    // 卸载完成
    if (mpxDevTools && typeof mpxDevTools.onComponentUnmounted === 'function') {
      mpxDevTools.onComponentUnmounted(this)
    }
  },

}

export default mpxDevToolsMixin