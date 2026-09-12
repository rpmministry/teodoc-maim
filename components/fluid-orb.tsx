'use client'

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export type FluidOrbProps = React.ComponentProps<'div'> & {
  color?: string
  /** Cuando es false, dibuja un cuadro estático y detiene el bucle (ahorra GPU). */
  active?: boolean
}

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.6;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float t = u_time * 0.22;

  vec2 drift = vec2(
    sin(t) + 0.6 * sin(t * 1.7 + 1.3),
    cos(t * 0.8) + 0.6 * cos(t * 1.3 + 2.1)
  );

  vec2 p = vec2(uv.x * 1.8, uv.y * 1.0) + drift * 0.7;

  vec2 q = vec2(fbm(p + drift), fbm(p + vec2(3.2, 1.5) - drift));
  float f = fbm(p + 1.2 * q);

  float g = clamp(1.0 - uv.y, 0.0, 1.0);
  float anchor = smoothstep(0.0, 0.3, uv.y);
  float shade = clamp(g + (f - 0.5) * 0.8 * anchor, 0.0, 1.0);

  vec3 white = vec3(0.99, 1.0, 1.0);
  vec3 light = mix(white, u_color, 0.5);
  vec3 dark = u_color;

  vec3 col = white;
  col = mix(col, light, smoothstep(0.28, 0.52, shade));
  col = mix(col, dark, smoothstep(0.58, 0.88, shade));

  float edge = smoothstep(0.5, 0.49, distance(uv, vec2(0.5)));

  gl_FragColor = vec4(col * edge, edge);
}
`

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  }
  const n = parseInt(h, 16)
  if (h.length !== 6 || Number.isNaN(n)) return [0.1, 0.45, 0.95]
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

const FluidOrb = ({ color = '#1A73F2', active = true, className, style, ...props }: FluidOrbProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  // Si WebGL no está disponible (o se pierde el contexto) el orbe NO debe
  // desaparecer: se recurre a una esfera CSS con el mismo lenguaje visual.
  const [webglOk, setWebglOk] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const gl = canvas.getContext('webgl', { antialias: true, alpha: true })
    if (!gl) {
      setWebglOk(false)
      return
    }

    const onContextLost = (event: Event) => {
      event.preventDefault()
      setWebglOk(false)
    }
    canvas.addEventListener('webglcontextlost', onContextLost)

    const program = gl.createProgram()
    const vert = compile(gl, gl.VERTEX_SHADER, VERT)
    const frag = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!program || !vert || !frag) {
      setWebglOk(false)
      return
    }

    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program))
      setWebglOk(false)
      return
    }
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    if (!buffer) {
      setWebglOk(false)
      return
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )
    const aPos = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uResolution = gl.getUniformLocation(program, 'u_resolution')
    const uTime = gl.getUniformLocation(program, 'u_time')
    gl.uniform3f(gl.getUniformLocation(program, 'u_color'), ...hexToRgb(color))

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const loseContext = gl.getExtension('WEBGL_lose_context')
    const start = performance.now()
    let raf = 0
    let lastNow = start

    const drawFrame = (now: number) => {
      lastNow = now
      gl.uniform1f(uTime, reduce ? 0 : (now - start) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    // Resolución según el tamaño real del contenedor (responsive) con DPR acotado.
    // Al cambiar el tamaño el canvas se limpia: redibujamos de inmediato para que
    // el orbe no quede en blanco cuando no hay bucle (reduced-motion o inactivo).
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = wrap.getBoundingClientRect()
      const base = Math.min(rect.width || 0, rect.height || 0) || 240
      const px = Math.max(1, Math.round(base * dpr))
      if (canvas.width !== px || canvas.height !== px) {
        canvas.width = px
        canvas.height = px
        gl.viewport(0, 0, px, px)
        gl.uniform2f(uResolution, px, px)
        drawFrame(lastNow)
      }
    }
    resize()

    let ro: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(resize)
      ro.observe(wrap)
    } else {
      window.addEventListener('resize', resize)
    }

    const render = (now: number) => {
      drawFrame(now)
      // Solo anima la capa activa (la otra se congela mientras se desvanece).
      if (!reduce && active) raf = requestAnimationFrame(render)
    }
    render(start)

    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      if (ro) ro.disconnect()
      else window.removeEventListener('resize', resize)
      gl.deleteProgram(program)
      gl.deleteShader(vert)
      gl.deleteShader(frag)
      gl.deleteBuffer(buffer)
      if (loseContext) loseContext.loseContext()
    }
  }, [color, active])

  return (
    <div
      ref={wrapRef}
      data-slot="fluid-orb"
      className={cn('relative overflow-hidden rounded-full', className)}
      style={style}
      {...props}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
      {!webglOk ? (
        <div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 50% 36%, #ffffff 0%, #e8f1ff 18%, #a6c8ff 42%, #3c82ff 68%, #0f62fe 86%, #0043ce 100%)',
            boxShadow: 'inset -12px -20px 44px rgba(0, 45, 156, 0.35), 0 0 60px rgba(15, 98, 254, 0.35)',
            animation: 'orbe-glow 4s ease-in-out infinite',
          }}
        />
      ) : null}
    </div>
  )
}

export default FluidOrb
