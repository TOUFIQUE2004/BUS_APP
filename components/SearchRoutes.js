"use client"

import { useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Search, MapPin } from "lucide-react"

export default function SearchRoutes({ onSearch, loading }) {
  const [allStops, setAllStops] = useState([]);
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [sourceOpen, setSourceOpen] = useState(false);
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [filteredSource, setFilteredSource] = useState([]);
  const [filteredDestination, setFilteredDestination] = useState([]);
  const [fuseSource, setFuseSource] = useState(null);
  const [fuseDestination, setFuseDestination] = useState(null);

  useEffect(() => {
    // Fetch and process bus stops from busInfo.json
    fetch('/busInfo.json')
      .then(res => res.json())
      .then(data => {
        const stops = new Set();
        data.forEach(bus => {
          bus.schedule.forEach(stop => {
            stops.add(stop.stopageName);
          });
        });
        const stopsArr = Array.from(stops);
        setAllStops(stopsArr);
        setFilteredSource(stopsArr);
        setFilteredDestination(stopsArr);
        setFuseSource(new Fuse(stopsArr, { threshold: 0.3 }));
        setFuseDestination(new Fuse(stopsArr, { threshold: 0.3 }));
      });
  }, []);

  const handleSourceChange = (value) => {
    setSource(value);
    if (fuseSource && value.trim()) {
      setFilteredSource(fuseSource.search(value).map(r => r.item));
    } else {
      setFilteredSource(allStops);
    }
  };

  const handleDestinationChange = (value) => {
    setDestination(value);
    if (fuseDestination && value.trim()) {
      setFilteredDestination(fuseDestination.search(value).map(r => r.item));
    } else {
      setFilteredDestination(allStops);
    }
  };

  const handleSearch = () => {
    if (source && destination) {
      onSearch(source, destination);
      setSourceOpen(false);
      setDestinationOpen(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Source Input */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium mb-1">
          <MapPin className="h-4 w-4 text-green-600" />
          <span>From (Source)</span>
        </label>
        <Command className="border rounded-lg">
          <CommandInput 
            placeholder="Enter source location"
            value={source}
            onValueChange={handleSourceChange}
            onFocus={() => setSourceOpen(true)}
            onBlur={() => setTimeout(() => setSourceOpen(false), 200)}
          />
          {sourceOpen && (
            <CommandList>
              <CommandEmpty>No stops found.</CommandEmpty>
              <CommandGroup className="max-h-[200px] overflow-auto">
                {filteredSource.map((stop) => (
                  <CommandItem
                    key={stop}
                    onSelect={() => {
                      setSource(stop);
                      setSourceOpen(false);
                    }}
                  >
                    {stop}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          )}
        </Command>
      </div>

      {/* Destination Input */}
      <div className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium mb-1">
          <MapPin className="h-4 w-4 text-red-600" />
          <span>To (Destination)</span>
        </label>
        <Command className="border rounded-lg">
          <CommandInput 
            placeholder="Enter destination"
            value={destination}
            onValueChange={handleDestinationChange}
            onFocus={() => setDestinationOpen(true)}
            onBlur={() => setTimeout(() => setDestinationOpen(false), 200)}
          />
          {destinationOpen && (
            <CommandList>
              <CommandEmpty>No stops found.</CommandEmpty>
              <CommandGroup className="max-h-[200px] overflow-auto">
                {filteredDestination.map((stop) => (
                  <CommandItem
                    key={stop}
                    onSelect={() => {
                      setDestination(stop);
                      setDestinationOpen(false);
                    }}
                  >
                    {stop}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          )}
        </Command>
      </div>

      {/* Search Button */}
      <div className="flex items-end">
        <Button 
          onClick={handleSearch} 
          className="w-full" 
          size="lg"
          disabled={loading || !source || !destination}
        >
          {loading ? 'Searching...' : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Search Buses
            </>
          )}
        </Button>
      </div>
    </div>
  );
}