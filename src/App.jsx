import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import FloatingLogo from './components/FloatingLogo'
import Hero from './sections/Hero'
import About from './sections/About'
import HowICanHelp from './sections/HowICanHelp'
import FeaturedProject from './sections/FeaturedProject'
import Metrics from './sections/Metrics'
import Stack from './sections/Stack'
import InteractiveIdentity from './sections/InteractiveIdentity'
import NextProjects from './sections/NextProjects'
import Collaborate from './sections/Collaborate'
import AINews from './sections/AINews'
import Reviews from './sections/Reviews'
import ReviewForm from './sections/ReviewForm'
import Contact from './sections/Contact'
import { content } from './data/content'
import './App.css'

const THEMES = ['dark', 'light', 'hacker']

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const cycleTheme = () => {
    setTheme((prev) => {
      const idx = THEMES.indexOf(prev)
      return THEMES[(idx + 1) % THEMES.length]
    })
  }

  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal--visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    reveals.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <Navbar theme={theme} cycleTheme={cycleTheme} />
      <main>
        <Hero />
        <About />
        <HowICanHelp />
        <FeaturedProject />
        <Metrics />
        <Stack />
        <InteractiveIdentity />
        <NextProjects />
        <Collaborate />
        <AINews newsItems={content.aiNews} />
        <ReviewForm />
        <Reviews />
        <Contact />
      </main>
      <Footer />
      <FloatingLogo />
    </>
  )
}
