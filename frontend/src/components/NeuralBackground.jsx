import { useEffect, useRef } from 'react'
import styles from './NeuralBackground.module.css'

export default function NeuralBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationFrameId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    let mouse = {
      x: null,
      y: null,
      radius: 140
    }

    const handleMouseMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    const handleMouseLeave = () => {
      mouse.x = null
      mouse.y = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      initParticles()
    }

    window.addEventListener('resize', handleResize)

    // Particle nodes
    let particles = []
    const particleCount = Math.min(Math.floor((width * height) / 14000), 85)

    // Synaptic pulses traveling along lines
    let pulses = []

    class Particle {
      constructor() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.vx = (Math.random() - 0.5) * 0.6
        this.vy = (Math.random() - 0.5) * 0.6
        this.radius = Math.random() * 1.8 + 1.2
        this.baseRadius = this.radius
        // alternating color types
        const types = ['mint', 'cyan', 'purple']
        this.type = types[Math.floor(Math.random() * types.length)]
        this.pulsePhase = Math.random() * Math.PI * 2
      }

      update() {
        this.x += this.vx
        this.y += this.vy
        this.pulsePhase += 0.03

        if (this.x < 0 || this.x > width) this.vx *= -1
        if (this.y < 0 || this.y > height) this.vy *= -1

        // Mouse reaction (subtle attraction/repulsion)
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x
          const dy = mouse.y - this.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < mouse.radius) {
            const force = (1 - dist / mouse.radius) * 1.5
            this.x -= (dx / dist) * force
            this.y -= (dy / dist) * force
          }
        }
      }

      draw() {
        ctx.beginPath()
        const currentRadius = this.baseRadius + Math.sin(this.pulsePhase) * 0.4
        ctx.arc(this.x, this.y, Math.max(0.5, currentRadius), 0, Math.PI * 2)

        if (this.type === 'mint') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.7)'
          ctx.shadowColor = '#7dd3fc'
          ctx.shadowBlur = 8
        } else if (this.type === 'cyan') {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.75)'
          ctx.shadowColor = '#38bdf8'
          ctx.shadowBlur = 8
        } else {
          ctx.fillStyle = 'rgba(186, 230, 253, 0.6)'
          ctx.shadowColor = '#bae6fd'
          ctx.shadowBlur = 6
        }

        ctx.fill()
        ctx.shadowBlur = 0 // reset
      }
    }

    function initParticles() {
      particles = []
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle())
      }
    }

    initParticles()

    // Periodically spawn synaptic packet pulses
    const pulseInterval = setInterval(() => {
      if (particles.length > 2 && pulses.length < 15) {
        const fromIdx = Math.floor(Math.random() * particles.length)
        let closestIdx = -1
        let minDist = 140

        for (let j = 0; j < particles.length; j++) {
          if (fromIdx === j) continue
          const dx = particles[fromIdx].x - particles[j].x
          const dy = particles[fromIdx].y - particles[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < minDist) {
            minDist = d
            closestIdx = j
          }
        }

        if (closestIdx !== -1) {
          pulses.push({
            p1: particles[fromIdx],
            p2: particles[closestIdx],
            progress: 0,
            speed: 0.02 + Math.random() * 0.02,
            color: Math.random() > 0.5 ? '#6ee7b7' : '#7dd3fc'
          })
        }
      }
    }, 400)

    function drawConnections() {
      const maxDist = 130
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.22
            ctx.beginPath()
            const grad = ctx.createLinearGradient(
              particles[i].x,
              particles[i].y,
              particles[j].x,
              particles[j].y
            )
            grad.addColorStop(0, `rgba(110, 231, 183, ${alpha})`)
            grad.addColorStop(1, `rgba(125, 211, 252, ${alpha})`)
            ctx.strokeStyle = grad
            ctx.lineWidth = 0.75
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }

        // Connect to mouse
        if (mouse.x !== null && mouse.y !== null) {
          const dx = particles[i].x - mouse.x
          const dy = particles[i].y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < mouse.radius) {
            const alpha = (1 - dist / mouse.radius) * 0.4
            ctx.beginPath()
            ctx.strokeStyle = `rgba(125, 211, 252, ${alpha})`
            ctx.lineWidth = 1
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(mouse.x, mouse.y)
            ctx.stroke()
          }
        }
      }

      // Draw moving synaptic pulses
      for (let k = pulses.length - 1; k >= 0; k--) {
        const pulse = pulses[k]
        pulse.progress += pulse.speed
        if (pulse.progress >= 1) {
          pulses.splice(k, 1)
          continue
        }

        const px = pulse.p1.x + (pulse.p2.x - pulse.p1.x) * pulse.progress
        const py = pulse.p1.y + (pulse.p2.y - pulse.p1.y) * pulse.progress

        ctx.beginPath()
        ctx.arc(px, py, 2, 0, Math.PI * 2)
        ctx.fillStyle = pulse.color
        ctx.shadowColor = pulse.color
        ctx.shadowBlur = 10
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i++) {
        particles[i].update()
        particles[i].draw()
      }

      drawConnections()
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      clearInterval(pulseInterval)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className={styles.bgContainer}>
      <div className={styles.ambientMint} />
      <div className={styles.ambientCyan} />
      <div className={styles.ambientPurple} />
      <div className={styles.gridOverlay} />
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  )
}
