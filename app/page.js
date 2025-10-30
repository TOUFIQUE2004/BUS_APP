'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'
const SearchRoutes = dynamic(() => import('@/components/SearchRoutes'), { ssr: false })
const RouteMap = dynamic(() => import('@/components/RouteMap'), { ssr: false })
import SearchHistory from '@/components/SearchHistory'
import Footer from '@/components/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bus, MapPin, Clock, ArrowRight, User, LogOut, Search, Phone, Building2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'

const Home = () => {
  const [user, setUser] = useState(null)
  const [locations, setLocations] = useState([])
  const [sourceLocation, setSourceLocation] = useState('')
  const [destLocation, setDestLocation] = useState('')
  const [buses, setBuses] = useState([])
  const [selectedBus, setSelectedBus] = useState(null)
  const [showBusDetails, setShowBusDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      const data = await response.json()
      setLocations(data.locations || [])
    } catch (error) {
      console.error('Error fetching locations:', error)
      toast({
        title: "Error",
        description: "Failed to fetch locations",
        variant: "destructive"
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setBuses([])
    toast({
      title: "Logged out",
      description: "You have been logged out successfully"
    })
  }

  const handleSearchBuses = async () => {
    if (!sourceLocation || !destLocation) {
      toast({
        title: "Missing Information",
        description: "Please select both source and destination",
        variant: "destructive"
      })
      return
    }
    
    if (sourceLocation === destLocation) {
      toast({
        title: "Invalid Selection",
        description: "Source and destination cannot be the same",
        variant: "destructive"
      })
      return
    }
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      
      const response = await fetch(
        `/api/search-routes?source=${encodeURIComponent(sourceLocation)}&destination=${encodeURIComponent(destLocation)}`,
        { headers }
      )
      const data = await response.json()
      
      if (data.buses && data.buses.length > 0) {
        setBuses(data.buses)
        toast({
          title: "Buses Found!",
          description: `Found ${data.buses.length} bus(es) for your route`
        })
      } else {
        setBuses([])
        toast({
          title: "No Buses Found",
          description: "No direct buses available for this route",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error searching buses:', error)
      toast({
        title: "Error",
        description: "Failed to search buses",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBusClick = (bus) => {
    setSelectedBus(bus)
    setShowBusDetails(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      <Toaster />
      
      <header className="border-b bg-white/95 backdrop-blur sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
              <Bus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">MyBusApp</h1>
              <p className="text-xs text-gray-500">Find your perfect route</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2">
              <Card className="shadow-lg border-2">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center space-x-2">
                    <Search className="h-6 w-6 text-blue-600" />
                    <span>Find Your Bus</span>
                  </CardTitle>
                  <CardDescription>Select your source and destination to find available buses</CardDescription>
                </CardHeader>
                <CardContent>
                  <SearchRoutes 
                    onSearch={(source, dest) => {
                      setSourceLocation(source);
                      setDestLocation(dest);
                      handleSearchBuses();
                    }}
                    loading={loading}
                  />
                
                  {sourceLocation && destLocation && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-center space-x-3">
                      <Badge variant="outline" className="px-3 py-1">{sourceLocation}</Badge>
                      <ArrowRight className="h-5 w-5 text-blue-600" />
                      <Badge variant="outline" className="px-3 py-1">{destLocation}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {buses.length > 0 && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">Available Buses ({buses.length})</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {buses.map((bus, index) => (
                      <Card 
                        key={index}
                        className="cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] border-2 hover:border-blue-400"
                        onClick={() => handleBusClick(bus)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-xl mb-1">{bus.busName}</CardTitle>
                              {bus.alternateName && (
                                <p className="text-sm text-gray-500">{bus.alternateName}</p>
                              )}
                            </div>
                            <Badge className="bg-green-500">{bus.busType?.split(' - ')[1] || 'NON AC'}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2 text-sm">
                              <MapPin className="h-4 w-4 text-green-600" />
                              <span className="font-semibold">{bus.sourceStop?.stopageName}</span>
                              <span className="text-gray-500">{bus.sourceStop?.upTime !== '_ _ : _ _' ? bus.sourceStop?.upTime : 'Time N/A'}</span>
                            </div>
                            <div className="flex items-center justify-center">
                              <ArrowRight className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                              <MapPin className="h-4 w-4 text-red-600" />
                              <span className="font-semibold">{bus.destStop?.stopageName}</span>
                              <span className="text-gray-500">{bus.destStop?.upTime !== '_ _ : _ _' ? bus.destStop?.upTime : 'Time N/A'}</span>
                            </div>
                            
                            <div className="pt-3 border-t">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center space-x-1">
                                  <Building2 className="h-3 w-3 text-gray-500" />
                                  <span className="text-gray-600">{bus.agencyName || 'Agency N/A'}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Badge variant="outline" className="text-xs">{bus.registrationNumber}</Badge>
                                </div>
                              </div>
                            </div>
                            
                            <Button variant="outline" className="w-full mt-2" size="sm">
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <RouteMap buses={buses} source={sourceLocation} destination={destLocation} />
                </div>
              )}
              
              {!loading && buses.length === 0 && (sourceLocation || destLocation) && (
                <Card className="text-center py-12 mt-6">
                  <CardContent>
                    <Bus className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold mb-2">No Buses Found</h3>
                    <p className="text-gray-500">Try selecting different locations or check back later</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showBusDetails} onOpenChange={setShowBusDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-2xl">
              <Bus className="h-6 w-6 text-blue-600" />
              <span>{selectedBus?.busName}</span>
            </DialogTitle>
            <DialogDescription>
              Complete bus information and schedule
            </DialogDescription>
          </DialogHeader>
          
          {selectedBus && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Badge className="mb-2">{selectedBus.busType?.split(' - ')[0]}</Badge>
                    <p className="text-xs text-gray-500">Bus Type</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="font-semibold">{selectedBus.registrationNumber}</p>
                    <p className="text-xs text-gray-500">Registration</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Phone className="h-5 w-5 mx-auto mb-1 text-green-600" />
                    <p className="text-xs font-semibold">{selectedBus.contactNumber}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Building2 className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                    <p className="text-xs font-semibold">{selectedBus.agencyName || 'N/A'}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Route Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">From</p>
                      <p className="font-semibold">{selectedBus.depotName}</p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">To</p>
                      <p className="font-semibold">{selectedBus.destination}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Your Journey Stops</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                      {selectedBus.routeStops?.map((stop, index) => (
                        <div key={index} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex-shrink-0 mt-1">
                            <div className={`w-4 h-4 rounded-full ${
                              index === 0 ? 'bg-green-500' : 
                              index === selectedBus.routeStops.length - 1 ? 'bg-red-500' : 
                              'bg-blue-400'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{stop.stopageName}</p>
                            <div className="flex space-x-4 mt-1 text-xs text-gray-600">
                              <div>
                                <span className="text-gray-500">Up: </span>
                                <span className="font-medium">{stop.upTime !== '_ _ : _ _' ? stop.upTime : 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Down: </span>
                                <span className="font-medium">{stop.downTime !== '_ _ : _ _' ? stop.downTime : 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          {index === 0 && <Badge variant="outline" className="text-xs">Start</Badge>}
                          {index === selectedBus.routeStops.length - 1 && <Badge variant="outline" className="text-xs">End</Badge>}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="flex space-x-2">
                <Button className="flex-1" onClick={() => setShowBusDetails(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer source={sourceLocation} destination={destLocation} />
    </div>
  );
}

export default function Page() {
  return <Home />;
}
