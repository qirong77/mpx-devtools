/**
 * MPX DevTools Component Mixin
 * 组件专用混入，监听组件的挂载和卸载
 */

import mpxDevTools from '../mpx-devtools.js'

export const mpxDevToolsComponentMixin = {
  // 小程序原生组件生命周期（最优先，兼容性最好）
  attached() {
    try {
      mpxDevTools.onComponentMounted(this)
      console.log('[mpxDevTools] Component attached hook called')
    } catch (error) {
      console.error('[mpxDevTools] Error in component attached hook:', error)
    }
  },

  detached() {
    try {
      mpxDevTools.onComponentUnmounted(this)
      console.log('[mpxDevTools] Component detached hook called')
    } catch (error) {
      console.error('[mpxDevTools] Error in component detached hook:', error)
    }
  },

  // MPX 增强生命周期（作为备选）
  mounted() {
    try {
      mpxDevTools.onComponentMounted(this)
      console.log('[mpxDevTools] Component mounted hook called')
    } catch (error) {
      console.error('[mpxDevTools] Error in component mounted hook:', error)
    }
  },

  unmounted() {
    try {
      mpxDevTools.onComponentUnmounted(this)
      console.log('[mpxDevTools] Component unmounted hook called')
    } catch (error) {
      console.error('[mpxDevTools] Error in component unmounted hook:', error)
    }
  },

  // 组件实例刚刚被创建（也监听一下）
  created() {
    console.log('[mpxDevTools] Component created hook called')
  },

  // 组件在视图层布局完成后执行
  ready() {
    console.log('[mpxDevTools] Component ready hook called')
  }
}

export default mpxDevToolsComponentMixin

