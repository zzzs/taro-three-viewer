import { Component, PropsWithChildren } from 'react'
import { View, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import * as THREE from 'three-platformize'
import { OrbitControls } from 'three-platformize/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three-platformize/examples/jsm/loaders/GLTFLoader'
import { WechatPlatform } from 'three-platformize/src/WechatPlatform'
import './index.scss'

export default class Index extends Component<any> {
  canvas: any = null
  renderer: any = null
  scene: any = null
  camera: any = null
  controls: any = null
  platform: any = null

  componentDidMount() {
    // 检查环境
    if (process.env.TARO_ENV === 'h5') {
      this.initH5()
    } else {
      // 微信小程序等环境需要特定的适配逻辑
      this.initWeChat()
    }
  }

  componentWillUnmount() {
    if (this.platform) {
      this.platform.dispose()
    }
  }

  initThree(canvas: any, width: number, height: number, dpr: number, isWeChat: boolean = false) {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x101010)

    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    this.camera.position.set(0, 2, 5)

    // 注意：小程序中 canvas 对象传递给 renderer 的方式可能略有不同，
    // 但 three-platformize 的 WechatPlatform 会处理大部分兼容性。
    // 这里传入 canvas: canvas 是关键。
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(dpr)

    // 控制器需要 domElement，在小程序中也是 canvas
    this.controls = new OrbitControls(this.camera, canvas as any)
    this.controls.enableDamping = true

    const ambientLight = new THREE.AmbientLight(0xffffff, 1)
    this.scene.add(ambientLight)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(5, 5, 5)
    this.scene.add(dirLight)

    const loader = new GLTFLoader()

    console.log('Starting to load model...')
    // 注意：小程序加载网络资源需要在微信后台配置 downloadFile 域名
    // 测试时请在详情中勾选“不校验合法域名、web-view（业务域名）、TLS版本以及HTTPS证书”
    const modelUrl = 'https://sitecdn.zcycdn.com/1167DH/20261/0d59ec16-dcb2-4a55-9853-2469b07fed9a.glb'

    loader.load(
      modelUrl,
      (gltf) => {
        console.log('Model loaded successfully', gltf)
        gltf.scene.scale.set(0.1, 0.1, 0.1)
        this.scene.add(gltf.scene)

        const box = new THREE.Box3().setFromObject(gltf.scene)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const fov = this.camera.fov * (Math.PI / 180)
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
        cameraZ *= 2
        this.camera.position.z = cameraZ
        this.camera.lookAt(center)
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded')
      },
      (error) => {
        console.error('An error happened', error)
      }
    )

    const animate = () => {
      // 小程序和 H5 都支持 requestAnimationFrame，但 three-platformize 可能会覆盖 window.requestAnimationFrame
      if (isWeChat) {
         (canvas as any).requestAnimationFrame(animate)
      } else {
         requestAnimationFrame(animate)
      }

      if (this.controls) this.controls.update()
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
      }
    }

    // 开始动画循环
    animate()
  }

  initH5() {
    // 延时一下确保 DOM 渲染
    setTimeout(() => {
      const canvasEl = document.querySelector('.taro-canvas-container canvas') as HTMLCanvasElement || document.getElementById('three-canvas') as HTMLCanvasElement

      if (!canvasEl) {
        console.error('Canvas element not found')
        return
      }

      this.initThree(canvasEl, window.innerWidth, window.innerHeight, window.devicePixelRatio, false)
    }, 100)
  }

  initWeChat() {
    console.log('Initializing WeChat adapter...')
    const query = Taro.createSelectorQuery()
    query.select('#three-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) {
            console.error('Canvas node not found')
            return
        }

        const canvas = res[0].node
        const width = res[0].width
        const height = res[0].height

        // 初始化 Platform
        const platform = new WechatPlatform(canvas)
        this.platform = platform
        THREE.PLATFORM.set(platform)

        console.log('Platform set, initializing Three.js...')
        // 注意：小程序 pixelRatio 需要获取系统信息
        const info = Taro.getSystemInfoSync()
        const dpr = info.pixelRatio

        // 显式设置 canvas 宽高（物理像素）
        canvas.width = width * dpr
        canvas.height = height * dpr

        this.initThree(canvas, width, height, dpr, true)
      })
  }

  onTouch(e) {
    if (!this.platform) return

    // 处理 touchcancel，将其映射为 touchend 以确保状态复位
    let type = e.type
    if (type === 'touchcancel') {
      type = 'touchend'
    }

    // 解决 three-platformize 只处理第一个 changedTouches 的问题
    // 如果有多个触点同时变化（如双指同时抬起），需要拆分触发
    if (e.changedTouches && e.changedTouches.length > 0) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]
        this.platform.dispatchTouchEvent({
          ...e,
          type: type,
          changedTouches: [touch]
        })
      }
    } else {
      // 兜底逻辑
      this.platform.dispatchTouchEvent({
        ...e,
        type: type
      })
    }
  }

  render() {
    return (
      <View className='index'>
        {/* H5 Canvas */}
        <Canvas
          type="webgl"
          id="three-canvas"
          canvasId="three-canvas"
          className="taro-canvas-container"
          style={{ width: '100%', height: '100vh', display: 'block' }}
          onTouchStart={this.onTouch.bind(this)}
          onTouchMove={this.onTouch.bind(this)}
          onTouchEnd={this.onTouch.bind(this)}
          onTouchCancel={this.onTouch.bind(this)}
        />
      </View>
    )
  }
}
