import { Component, PropsWithChildren } from 'react'
import { View, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import './index.scss'

export default class Index extends Component<any> {
  canvas: any = null
  renderer: any = null
  scene: any = null
  camera: any = null
  controls: any = null

  componentDidMount() {
    // 检查环境
    if (process.env.TARO_ENV === 'h5') {
      this.initH5()
    } else {
      // 微信小程序等环境需要特定的适配逻辑
      // 在实际项目中，可以使用 'three-platformize' 或 'taro-gl' 等库进行适配
      this.initWeChat()
    }
  }

  initH5() {
    // 简单的 H5 Three.js 初始化
    const canvas = document.querySelector('#three-canvas canvas') as HTMLCanvasElement || document.getElementById('three-canvas') as HTMLCanvasElement
    // Note: Taro H5 <Canvas> might render a wrapper div or canvas with different ID structure depending on version.
    // In Taro 3.x H5, <Canvas id="foo" /> usually renders <canvas id="foo" ...> inside a wrapper.

    // 延时一下确保 DOM 渲染
    setTimeout(() => {
      const canvasEl = document.querySelector('.taro-canvas-container canvas') as HTMLCanvasElement || document.getElementById('three-canvas') as HTMLCanvasElement

      if (!canvasEl) {
        console.error('Canvas element not found')
        return
      }

      const width = window.innerWidth
      const height = window.innerHeight

      this.scene = new THREE.Scene()
      this.scene.background = new THREE.Color(0x101010)

      this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
      this.camera.position.set(0, 2, 5)

      this.renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true })
      this.renderer.setSize(width, height)
      this.renderer.setPixelRatio(window.devicePixelRatio)

      this.controls = new OrbitControls(this.camera, this.renderer.domElement)
      this.controls.enableDamping = true

      const ambientLight = new THREE.AmbientLight(0xffffff, 1)
      this.scene.add(ambientLight)
      const dirLight = new THREE.DirectionalLight(0xffffff, 1)
      dirLight.position.set(5, 5, 5)
      this.scene.add(dirLight)

      const loader = new GLTFLoader()

      console.log('Starting to load model...')

      // 示例模型: 鸭子
      loader.load(
        '/cloud_sentinel.glb',
        // 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
        (gltf) => {
          console.log('Model loaded successfully', gltf)
          gltf.scene.scale.set(0.1, 0.1, 0.1) // 尝试缩小模型，防止模型过大导致看不见
          this.scene.add(gltf.scene)

          // 自动调整相机位置以适应模型
          const box = new THREE.Box3().setFromObject(gltf.scene)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z)
          const fov = this.camera.fov * (Math.PI / 180)
          let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))
          cameraZ *= 2 // 留出一些空间

          this.camera.position.z = cameraZ
          this.camera.lookAt(center)

        }, (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded')
        }, (error) => {
          console.error('An error happened', error)
        })

      const animate = () => {
        requestAnimationFrame(animate)
        if (this.controls) this.controls.update()
        if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera)
        }
      }
      animate()
    }, 100)
  }

  initWeChat() {
    console.log('WeChat environment detected. Please implement platform adapter.')
    Taro.showToast({ title: '请在开发者工具中查看代码注释以适配小程序', icon: 'none' })
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
        />
      </View>
    )
  }
}
