import { Bus, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'

const RouteMapDisplay = dynamic(() => import('@/components/RouteMapDisplay'), { ssr: false })

export default function Footer({ source = '', destination = '' }) {
  return (
    <footer className="border-t bg-gray-900 text-gray-300 mt-12">
      <div className="container mx-auto px-4 py-12">
        {/* Map Section */}
        {(source || destination) && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-white mb-4">Your Route</h3>
            <RouteMapDisplay source={source} destination={destination} />
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Left Section - Branding */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Bus className="h-5 w-5 text-blue-400" />
              <span className="font-bold text-white">MyBusApp</span>
            </div>
            <p className="text-sm text-gray-400">Your trusted partner for bus journey planning across West Bengal.</p>
          </div>

          {/* Right Section - Support */}
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <div className="space-y-3">
              {/* Call Button */}
              <a 
                href="tel:8630708034"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition text-white text-sm font-medium"
              >
                <Phone className="h-4 w-4" />
                <span>Call: 8630708034</span>
              </a>

              {/* WhatsApp Button */}
              <a 
                href="https://wa.me/8630708034"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition text-white text-sm font-medium ml-2"
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </a>

              {/* Email Section */}
              <div className="flex items-center space-x-2 text-sm mt-2">
                <span className="text-gray-400">Email:</span>
                <a 
                  href="mailto:toufiques236@gmail.com" 
                  className="text-blue-400 hover:text-blue-300 transition font-medium"
                >
                  toufiques236@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Copyright & Credits */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
            <p>&copy; 2025 MyBusApp. All rights reserved.</p>
            <p className="mt-4 md:mt-0">
              <span className="font-semibold text-gray-300">Developed by: </span>
              <span className="text-white font-medium">MD TOUFIQUE SHEIKH</span>
              <span className="mx-2">and</span>
              <span className="text-white font-medium">SOUMITRA DAS</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
