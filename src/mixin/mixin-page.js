/**
 * MPX DevTools Page Mixin
 * 页面专用混入，监听页面的挂载和卸载
 */

import mpxDevTools from '../mpx-devtools.js'

export const mpxDevToolsPageMixin = {
 
  // 使用原生页面生命周期
  onLoad(options) {
    mpxDevTools.onComponentMounted(this)
    console.debug('页面加载', options)
    console.debug(this)
    // 获取页面参数，初始化数据
  },
  
  onShow() {
    console.debug('页面显示')
    console.debug(this)
    debugger
    mpxDevTools.onComponentMounted(this)
  },
  
  onHide() {
    console.debug('页面隐藏')
    console.debug(this)
    mpxDevTools.onComponentUnmounted(this)
  },
  
  onReady() {
    console.debug('页面初次渲染完成')
    console.debug(this)

    mpxDevTools.onComponentMounted(this)
  },
  
  onUnload() {
    console.debug('页面卸载')
    console.debug(this)

    mpxDevTools.onComponentUnmounted(this)
    // 清理资源
  },
}

export default mpxDevToolsPageMixin
