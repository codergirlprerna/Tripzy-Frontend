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