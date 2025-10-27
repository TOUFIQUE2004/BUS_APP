import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

let cachedClient = null;
let cachedDb = null;
let busData = null;

async function connectToDatabase() {
  if (cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(process.env.MONGO_URL);
  const db = client.db(process.env.DB_NAME || 'busnavigation');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

function loadBusData() {
  if (busData) return busData;
  
  try {
    const filePath = path.join(process.cwd(), 'public', 'busInfo.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    busData = JSON.parse(fileContent);
    return busData;
  } catch (error) {
    console.error('Error loading bus data:', error);
    return [];
  }
}

function verifyToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function getAllLocations() {
  const buses = loadBusData();
  const locations = new Set();
  
  buses.forEach(bus => {
    locations.add(bus.depotName);
    locations.add(bus.destination);
    bus.schedule?.forEach(stop => {
      if (stop.stopageName && stop.stopageName !== '_ _ : _ _') {
        locations.add(stop.stopageName);
      }
    });
  });
  
  return Array.from(locations).sort();
}

function findBusesBetweenLocations(source, destination) {
  const buses = loadBusData();
  const matchingBuses = [];
  
  buses.forEach(bus => {
    const stops = bus.schedule?.map(s => s.stopageName) || [];
    
    // Check if source matches depot or any stoppage
    const sourceMatches = [
      bus.depotName === source ? 0 : -1,  // Check depot
      stops.indexOf(source)               // Check stoppages
    ].filter(idx => idx !== -1);
    
    // Check if destination matches final destination or any stoppage
    const destMatches = [
      bus.destination === destination ? stops.length - 1 : -1,  // Check final destination
      stops.indexOf(destination)                               // Check stoppages
    ].filter(idx => idx !== -1);
    
    // Find the earliest source match and latest destination match
    const sourceIndex = sourceMatches.length > 0 ? Math.min(...sourceMatches) : -1;
    const destIndex = destMatches.length > 0 ? Math.max(...destMatches) : -1;
    
    // Add bus if we found valid source and destination in correct order
    if (sourceIndex !== -1 && destIndex !== -1 && sourceIndex < destIndex) {
      const routeStops = bus.schedule.slice(sourceIndex, destIndex + 1);
      matchingBuses.push({
        ...bus,
        routeStops,
        sourceStop: bus.schedule[sourceIndex],
        destStop: bus.schedule[destIndex],
        isSourceDepot: bus.depotName === source,
        isDestinationFinal: bus.destination === destination
      });
    }
  });
  
  return matchingBuses;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api', '');

    if (path === '/' || path === '') {
      return NextResponse.json({ 
        message: 'Bus Navigation API',
        version: '2.0.0',
        endpoints: [
          '/api/auth/signup',
          '/api/auth/login',
          '/api/locations',
          '/api/buses',
          '/api/search-routes'
        ]
      });
    }

    if (path === '/locations' || path === '/locations/') {
      const locations = getAllLocations();
      return NextResponse.json({ locations });
    }

    if (path === '/buses' || path === '/buses/') {
      const buses = loadBusData();
      return NextResponse.json({ buses });
    }

    if (path === '/search-routes' || path === '/search-routes/') {
      const source = url.searchParams.get('source');
      const destination = url.searchParams.get('destination');
      
      if (!source || !destination) {
        return NextResponse.json({ error: 'Source and destination are required' }, { status: 400 });
      }
      
      const buses = findBusesBetweenLocations(source, destination);

      // Save search to history if user is authenticated
      const user = verifyToken(request);
      if (user) {
        try {
          const { db } = await connectToDatabase();
          await db.collection('searchHistory').insertOne({
            userId: user.userId,
            source,
            destination,
            timestamp: new Date(),
            resultCount: buses.length
          });
        } catch (error) {
          console.error('Error saving search history:', error);
        }
      }
      
      return NextResponse.json({ buses, source, destination });
    }

    if (path === '/search-history' || path === '/search-history/') {
      const user = verifyToken(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { db } = await connectToDatabase();
      const history = await db.collection('searchHistory')
        .find({ userId: user.userId })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();

      return NextResponse.json({ history });
    }

    if (path === '/profile' || path === '/profile/') {
      const user = verifyToken(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Only connect to the database for profile-related requests
      const { db } = await connectToDatabase();

      const userData = await db.collection('users').findOne(
        { id: user.userId },
        { projection: { password: 0 } }
      );

      return NextResponse.json({ user: userData });
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api', '');
    const body = await request.json();

    if (path === '/auth/signup') {
      const { name, email, password } = body;
      
      if (!name || !email || !password) {
        return NextResponse.json(
          { error: 'Name, email and password are required' },
          { status: 400 }
        );
      }

  // Connect to database only for signup/login operations
  const { db } = await connectToDatabase();

  const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();
      
      await db.collection('users').insertOne({
        id: userId,
        name,
        email,
        password: hashedPassword,
        createdAt: new Date()
      });

      const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
      
      return NextResponse.json({
        message: 'User created successfully',
        token,
        user: { id: userId, name, email }
      });
    }

    if (path === '/auth/login') {
      const { email, password } = body;
      
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        );
      }

  // Connect to database only for signup/login operations
  const { db } = await connectToDatabase();

  const user = await db.collection('users').findOne({ email });
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      
      return NextResponse.json({
        message: 'Login successful',
        token,
        user: { id: user.id, name: user.name, email: user.email }
      });
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}