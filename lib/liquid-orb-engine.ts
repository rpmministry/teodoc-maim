/* eslint-disable @typescript-eslint/no-explicit-any */
// Motor del "Liquid Orb" (WebGPU). Aísla todo el ciclo de vida —device,
// pipelines, buffers, textura y requestAnimationFrame— detrás de un handle
// con `setState` y `destroy`, para que el componente React no conozca detalles
// de GPU y no pueda filtrar memoria.
import { LIQUID_ORB_SHADER } from './liquid-orb-shader'
import { LIQUID_ORB_SEEDS, type LiquidOrbState } from './liquid-orb-seeds'

const RIBBON_STYLE_INDEX = 24
const RIBBON_INSTANCE_COUNT = 221184
const ACTIVATION_DURATION_MS = 220
const SETTLE_DURATION_MS = 650

export type LiquidOrbHandle = {
  setState: (state: LiquidOrbState) => void
  getState: () => LiquidOrbState
  destroy: () => void
}

export function isWebGPUAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!(navigator as any).gpu
}

export async function createLiquidOrb(
  canvas: HTMLCanvasElement,
  initialState: LiquidOrbState = 'idle',
): Promise<LiquidOrbHandle> {
  const gpu = (navigator as any).gpu
  if (!gpu) throw new Error('WebGPU is not supported in this environment.')

  const adapter = await gpu.requestAdapter()
  if (!adapter) throw new Error('No compatible WebGPU adapter was found.')
  const device: any = await adapter.requestDevice()
  const context: any = canvas.getContext('webgpu')
  if (!context) throw new Error('Unable to create a WebGPU canvas context.')

  const format: any = gpu.getPreferredCanvasFormat()
  context.configure({ device, format, alphaMode: 'premultiplied' })
  const shader = device.createShaderModule({ code: LIQUID_ORB_SHADER })
  const compilation = await shader.getCompilationInfo()
  const errors = compilation.messages.filter((message: any) => message.type === 'error')
  if (errors.length) {
    throw new Error(
      errors.map((message: any) => `${message.lineNum}:${message.linePos} ${message.message}`).join('\n'),
    )
  }

  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: shader, entryPoint: 'vs_main' },
    fragment: {
      module: shader,
      entryPoint: 'fs_main',
      targets: [{
        format,
        blend: {
          color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
          alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
        },
      }],
    },
    primitive: { topology: 'triangle-list' },
  })
  const ribbonPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: shader, entryPoint: 'ribbon_vs_main' },
    fragment: {
      module: shader,
      entryPoint: 'ribbon_fs_main',
      targets: [{
        format,
        blend: {
          color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
          alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
        },
      }],
    },
    primitive: { topology: 'triangle-list' },
  })
  const ribbonCompositePipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: shader, entryPoint: 'vs_main' },
    fragment: {
      module: shader,
      entryPoint: 'ribbon_composite_fs_main',
      targets: [{
        format,
        blend: {
          color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
          alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
        },
      }],
    },
    primitive: { topology: 'triangle-list' },
  })

  let state: LiquidOrbState = initialState
  let transitionTargetState: LiquidOrbState = initialState
  let fromUniforms = new Float32Array(LIQUID_ORB_SEEDS[state])
  let targetUniforms = new Float32Array(LIQUID_ORB_SEEDS[state])
  const displayedUniforms = new Float32Array(LIQUID_ORB_SEEDS[state])
  let transitionStartedAt = 0
  let activeTransitionDuration = 0

  const values = new Float32Array(displayedUniforms)
  const uniformBuffer = device.createBuffer({
    size: values.byteLength,
    usage: (globalThis as any).GPUBufferUsage.UNIFORM | (globalThis as any).GPUBufferUsage.COPY_DST,
  })
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  })
  const ribbonBindGroup = device.createBindGroup({
    layout: ribbonPipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
  })
  const ribbonSampler = device.createSampler({
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
    magFilter: 'linear',
    minFilter: 'linear',
  })
  let ribbonTarget: any = null
  let ribbonCompositeBindGroup: any = null

  function srgbToLinear(value: number) {
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  function linearToSrgb(value: number) {
    return value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055
  }
  function mixSrgb(from: number, to: number, progress: number) {
    return linearToSrgb(srgbToLinear(from) + (srgbToLinear(to) - srgbToLinear(from)) * progress)
  }
  function transitionProgress(now: number) {
    if (activeTransitionDuration === 0) return 1
    const raw = Math.min(1, Math.max(0, (now - transitionStartedAt) / activeTransitionDuration))
    return transitionTargetState === 'thinking' ? 1 - (1 - raw) ** 3 : raw * raw * (3 - 2 * raw)
  }
  function sampleTransition(now: number) {
    const progress = transitionProgress(now)
    for (let index = 3; index < displayedUniforms.length; index += 1) {
      const colorComponent = index >= 40 && (index - 40) % 4 < 3
      displayedUniforms[index] = colorComponent
        ? mixSrgb(fromUniforms[index], targetUniforms[index], progress)
        : fromUniforms[index] + (targetUniforms[index] - fromUniforms[index]) * progress
    }
    return displayedUniforms
  }

  let stopped = false
  let raf = 0
  let lastFrameAt: number | null = null
  let motionPhase = 0

  function stop() {
    if (stopped) return
    stopped = true
    cancelAnimationFrame(raf)
    try { ribbonTarget?.destroy() } catch { /* noop */ }
    ribbonTarget = null
    try { device.destroy() } catch { /* noop */ }
  }

  device.lost.then((info: any) => {
    if (!stopped) console.warn(`WebGPU device lost: ${info?.message || info?.reason || ''}`)
    stopped = true
  })
  device.addEventListener('uncapturederror', (event: any) => {
    event.preventDefault?.()
    console.warn('WebGPU rendering error:', event?.error?.message)
  })

  function frame(now: number) {
    if (stopped) return
    try {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      const height = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        try { ribbonTarget?.destroy() } catch { /* noop */ }
        ribbonTarget = null
        ribbonCompositeBindGroup = null
      }
      values.set(sampleTransition(now))
      const frameDelta = lastFrameAt === null ? 0 : Math.min(0.1, Math.max(0, (now - lastFrameAt) / 1000))
      lastFrameAt = now
      motionPhase += frameDelta * Math.max(values[3], 0)
      values[0] = width
      values[1] = height
      values[2] = motionPhase / Math.max(values[3], 0.001)
      device.queue.writeBuffer(uniformBuffer, 0, values)

      const isParticleRibbon = Math.round(values[15]) === RIBBON_STYLE_INDEX
      const encoder = device.createCommandEncoder()
      if (isParticleRibbon) {
        if (!ribbonTarget || !ribbonCompositeBindGroup) {
          ribbonTarget = device.createTexture({
            size: { width, height },
            format,
            usage: (globalThis as any).GPUTextureUsage.RENDER_ATTACHMENT | (globalThis as any).GPUTextureUsage.TEXTURE_BINDING,
          })
          ribbonCompositeBindGroup = device.createBindGroup({
            layout: ribbonCompositePipeline.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: { buffer: uniformBuffer } },
              { binding: 1, resource: ribbonTarget.createView() },
              { binding: 2, resource: ribbonSampler },
            ],
          })
        }
        const particlePass = encoder.beginRenderPass({
          colorAttachments: [{
            view: ribbonTarget.createView(),
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
            loadOp: 'clear',
            storeOp: 'store',
          }],
        })
        particlePass.setPipeline(ribbonPipeline)
        particlePass.setBindGroup(0, ribbonBindGroup)
        particlePass.draw(6, RIBBON_INSTANCE_COUNT)
        particlePass.end()
      }

      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
      })
      if (isParticleRibbon) {
        pass.setPipeline(ribbonCompositePipeline)
        pass.setBindGroup(0, ribbonCompositeBindGroup)
      } else {
        pass.setPipeline(pipeline)
        pass.setBindGroup(0, bindGroup)
      }
      pass.draw(3)
      pass.end()
      device.queue.submit([encoder.finish()])
      raf = requestAnimationFrame(frame)
    } catch (error) {
      console.warn('LiquidOrb frame error:', error)
      stop()
    }
  }

  raf = requestAnimationFrame(frame)

  return {
    setState(nextState: LiquidOrbState) {
      if (!Object.prototype.hasOwnProperty.call(LIQUID_ORB_SEEDS, nextState)) {
        throw new TypeError(`Unknown liquid orb state: ${nextState}`)
      }
      if (nextState === state || stopped) return
      const now = performance.now()
      sampleTransition(now)
      fromUniforms = new Float32Array(displayedUniforms)
      targetUniforms = new Float32Array(LIQUID_ORB_SEEDS[nextState])
      transitionTargetState = nextState
      transitionStartedAt = now
      activeTransitionDuration = nextState === 'thinking' ? ACTIVATION_DURATION_MS : SETTLE_DURATION_MS
      state = nextState
    },
    getState: () => state,
    destroy: stop,
  }
}
