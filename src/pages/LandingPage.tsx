import { useAuth } from '@/context/AuthContext'
import { Navigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import TrustStrip from '@/components/TrustStrip'
import HowItWorks from '@/components/HowItWorks'
import Features from '@/components/Features'
import Recap from '@/components/Recap'
import Pricing from '@/components/Pricing'
import Faq from '@/components/Faq'
import FinalCta from '@/components/FinalCta'
import Footer from '@/components/Footer'

export default function LandingPage() {
  const { currentUser, loading } = useAuth()

  // Without this, an already-logged-in person landing on "/" (typing the
  // bare URL, a bookmark, clicking the logo) sees the marketing page instead
  // of their trips — which looks exactly like being signed out, even though
  // the session is still fine. This is almost certainly what's behind
  // "I have to sign in again and again": the session was never lost, the
  // app was just showing the wrong page for a logged-in visitor.
  if (!loading && currentUser) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div>
      <Navbar />
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <Features />
      <Recap />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  )
}