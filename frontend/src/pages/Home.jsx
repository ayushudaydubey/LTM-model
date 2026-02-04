import styles from './Home.module.css'
import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'

export default function Home() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles = []
    const particleCount = 60

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.vx = (Math.random() - 0.5) * 0.3
        this.vy = (Math.random() - 0.5) * 0.3
        this.radius = Math.random() * 2 + 1
      }

      update() {
        this.x += this.vx
        this.y += this.vy

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(110, 231, 183, 0.4)'
        ctx.fill()
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    function connectParticles() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 120) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(125, 211, 252, ${0.15 * (1 - distance / 120)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })
      
      connectParticles()
      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className={styles.wrapper}>
      <canvas ref={canvasRef} className={styles.particleCanvas}></canvas>
      
      <div className={styles.container}>
        <div className={styles.hero}>
          <div className={styles.badge}>Next-Gen AI Assistant</div>
          <h1 className={styles.title}>
            <span className={styles.titleWord}>Lilly</span>
            <span className={styles.titleWord}>AI</span>
            <span className={styles.emoji}>🌸</span>
          </h1>
          <p className={styles.lead}>
            Experience the future of conversational AI with <strong>adaptive memory architecture</strong>,
            personalized interactions, and context-aware intelligence that evolves with you.
          </p>
        </div>
				   <section className={styles.ctaSection}>
          <h2 className={styles.ctaTitle}>Ready to Experience Intelligent Conversation?</h2>
          <p className={styles.ctaText}>
            Join thousands of users who trust Lilly AI for smarter, more personalized interactions.
          </p>
          <div className={styles.actions}>
            <Link to="/register" className={styles.button}>
              <span>Start Free Today</span>
              <span className={styles.buttonArrow}>→</span>
            </Link>
            <Link to="/login" className={styles.buttonSecondary}>
              <span>Sign In</span>
            </Link>
          </div>
        </section>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>∞</div>
            <div className={styles.statLabel}>Conversations</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>2x</div>
            <div className={styles.statLabel}>Memory Systems</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>24/7</div>
            <div className={styles.statLabel}>Availability</div>
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionIcon}>🧠</div>
          <h2 className={styles.subtitle}>Short-Term Memory (STM)</h2>
          <p className={styles.text}>
            Lilly's STM enables her to maintain perfect conversational flow within each session.
            She remembers every detail you mention, follows complex multi-step instructions,
            and adapts her responses based on the evolving context of your dialogue.
          </p>
          <div className={styles.featureList}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>⚡</span>
              <span>Real-time context retention</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🎯</span>
              <span>Precise instruction following</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🔄</span>
              <span>Dynamic conversation adaptation</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionIcon}>💾</div>
          <h2 className={styles.subtitle}>Long-Term Memory (LTM)</h2>
          <p className={styles.text}>
            With LTM, Lilly builds a deep understanding of your preferences, habits, and needs over time.
            She learns from every interaction to provide increasingly personalized assistance,
            remembering your goals, favorite topics, and communication style across all sessions.
          </p>
          <div className={styles.featureList}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📚</span>
              <span>Persistent knowledge base</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🎨</span>
              <span>Personalized experience evolution</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🔐</span>
              <span>Secure encrypted storage</span>
            </div>
          </div>
        </section>
				

        <section className={styles.section}>
          <div className={styles.sectionIcon}>✨</div>
          <h2 className={styles.subtitle}>Core Capabilities</h2>
          <div className={styles.capabilitiesGrid}>
            <div className={styles.capabilityCard}>
              <h3>Natural Conversations</h3>
              <p>Engage in fluid, human-like dialogue that feels authentic and contextually aware</p>
            </div>
            <div className={styles.capabilityCard}>
              <h3>Task Assistance</h3>
              <p>From brainstorming to problem-solving, get intelligent help with complex tasks</p>
            </div>
            <div className={styles.capabilityCard}>
              <h3>Creative Collaboration</h3>
              <p>Co-create content, explore ideas, and bring your creative visions to life</p>
            </div>
            <div className={styles.capabilityCard}>
              <h3>Learning Partner</h3>
              <p>Expand your knowledge with explanations tailored to your learning style</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionIcon}>🎯</div>
          <h2 className={styles.subtitle}>Perfect For</h2>
          <div className={styles.useCases}>
            <div className={styles.useCase}>
              <span className={styles.useCaseNumber}>01</span>
              <div>
                <h3>Professionals</h3>
                <p>Streamline workflows, draft documents, analyze data, and boost productivity</p>
              </div>
            </div>
            <div className={styles.useCase}>
              <span className={styles.useCaseNumber}>02</span>
              <div>
                <h3>Students</h3>
                <p>Get homework help, research assistance, and personalized study guidance</p>
              </div>
            </div>
            <div className={styles.useCase}>
              <span className={styles.useCaseNumber}>03</span>
              <div>
                <h3>Creators</h3>
                <p>Generate ideas, refine content, and overcome creative blocks with AI-powered inspiration</p>
              </div>
            </div>
            <div className={styles.useCase}>
              <span className={styles.useCaseNumber}>04</span>
              <div>
                <h3>Curious Minds</h3>
                <p>Explore topics, ask questions, and satisfy your intellectual curiosity</p>
              </div>
            </div>
          </div>
        </section>

     

        <footer className={styles.footer}>
          <p>Built with advanced memory architecture and natural language understanding</p>
        </footer>
      </div>
    </div>
  )
}