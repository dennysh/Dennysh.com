import React, { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Hero from './sections/Hero'
import About from './sections/About'
import HowICanHelp from './sections/HowICanHelp'
import FeaturedProject from './sections/FeaturedProject'
import Metrics from './sections/Metrics'
import Stack from './sections/Stack'
import InteractiveIdentity from './sections/InteractiveIdentity'
import NextProjects from './sections/NextProjects'
import Collaborate from './sections/Collaborate'
import Contact from './sections/Contact'
import './App.css'

export default function App() {
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
      <Navbar />
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
        <Contact />
      </main>
      <Footer />
    </>
  )
}
