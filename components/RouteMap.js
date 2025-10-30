"use client"

import { useState, useEffect } from 'react';
import { MapPin, Bus, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RouteMap({ buses, source, destination }) {
  const [selectedBus, setSelectedBus] = useState(null);

  if (!buses || buses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-2xl font-bold">Route Map & Timeline</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Bus List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-semibold text-lg">Available Buses</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {buses.map((bus, idx) => (
              <Card 
                key={idx}
                className={`cursor-pointer transition-all ${selectedBus === idx ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                onClick={() => setSelectedBus(selectedBus === idx ? null : idx)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-sm">{bus.busName}</p>
                      <p className="text-xs text-gray-600">{bus.agencyName}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {bus.busType.includes('AC') ? '🧊 AC' : 'Non-AC'}
                        </Badge>
                        {bus.direction && (
                          <Badge variant="secondary" className="text-xs">
                            {bus.direction === 'forward' ? '→' : '←'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Route Timeline */}
        <div className="lg:col-span-2">
          {selectedBus !== null ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="h-5 w-5" />
                  {buses[selectedBus].busName}
                </CardTitle>
                <CardDescription>
                  {source} → {destination}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Timeline */}
                  <div className="space-y-4">
                    {buses[selectedBus].routeStops?.map((stop, idx) => {
                      const isFirstStop = idx === 0;
                      const isLastStop = idx === (buses[selectedBus].routeStops?.length - 1);
                      const isSource = stop.stopageName === buses[selectedBus].sourceStop?.stopageName;
                      const isDestination = stop.stopageName === buses[selectedBus].destStop?.stopageName;

                      return (
                        <div key={idx} className="flex gap-4">
                          {/* Timeline Line and Icon */}
                          <div className="flex flex-col items-center">
                            {/* Vertical Line Above */}
                            {!isFirstStop && (
                              <div className="w-0.5 h-8 bg-gray-300 mb-2"></div>
                            )}

                            {/* Icon */}
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                                isSource
                                  ? 'bg-green-100 border-green-500'
                                  : isDestination
                                  ? 'bg-red-100 border-red-500'
                                  : 'bg-gray-100 border-gray-400'
                              }`}
                            >
                              {isSource ? (
                                <MapPin className="h-6 w-6 text-green-600" />
                              ) : isDestination ? (
                                <MapPin className="h-6 w-6 text-red-600" />
                              ) : (
                                <Bus className="h-5 w-5 text-gray-600" />
                              )}
                            </div>

                            {/* Vertical Line Below */}
                            {!isLastStop && (
                              <div className="w-0.5 h-8 bg-gray-300 mt-2"></div>
                            )}
                          </div>

                          {/* Stop Details */}
                          <div className="pt-2 pb-4 flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-sm">
                                  {stop.stopageName}
                                </p>
                                {(isSource || isDestination) && (
                                  <Badge
                                    className="mt-1"
                                    variant={isSource ? 'default' : 'destructive'}
                                  >
                                    {isSource ? 'Starting Point' : 'Destination'}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="flex gap-4 text-xs text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {stop.upTime !== '_ _ : _ _' ? `Up: ${stop.upTime}` : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {stop.downTime !== '_ _ : _ _' ? `Down: ${stop.downTime}` : 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bus Details Footer */}
                  <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Agency</p>
                      <p className="font-semibold">{buses[selectedBus].agencyName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Registration</p>
                      <p className="font-semibold">{buses[selectedBus].registrationNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Bus Type</p>
                      <p className="font-semibold">{buses[selectedBus].busType}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Contact</p>
                      <p className="font-semibold">{buses[selectedBus].contactNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Bus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a bus to view detailed route</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
