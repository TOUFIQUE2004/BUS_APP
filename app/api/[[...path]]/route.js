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
  
  // Normalization function
  const norm = s => (s || '').toLowerCase().trim();
  const srcNorm = norm(source);
  const destNorm = norm(destination);
  
  // Helper function to check if a string contains or matches another string
  const matches = (text, query) => {
    const normalized = norm(text);
    return normalized === query || normalized.includes(query) || query.includes(normalized);
  };
  
  buses.forEach(bus => {
    const stops = bus.schedule?.map(s => s.stopageName) || [];
    
    // Find all indices where source/destination matches
    const sourceIndices = new Set();
    const destIndices = new Set();
    
    stops.forEach((stop, idx) => {
      if (matches(stop, srcNorm)) sourceIndices.add(idx);
      if (matches(stop, destNorm)) destIndices.add(idx);
    });
    
    // Also check depot and final destination
    if (matches(bus.depotName, srcNorm)) sourceIndices.add(0);
    if (matches(bus.destination, srcNorm)) sourceIndices.add(stops.length - 1);
    if (matches(bus.depotName, destNorm)) destIndices.add(0);
    if (matches(bus.destination, destNorm)) destIndices.add(stops.length - 1);
    
    // For each source/destination index pair, check order
    sourceIndices.forEach(srcIdx => {
      destIndices.forEach(destIdx => {
        if (srcIdx !== destIdx) {
          if (srcIdx < destIdx) {
            const routeStops = bus.schedule.slice(srcIdx, destIdx + 1);
            matchingBuses.push({
              ...bus,
              routeStops,
              sourceStop: bus.schedule[srcIdx],
              destStop: bus.schedule[destIdx],
              direction: 'forward'
            });
          } else if (destIdx < srcIdx) {
            const routeStops = bus.schedule.slice(destIdx, srcIdx + 1).reverse();
            matchingBuses.push({
              ...bus,
              routeStops,
              sourceStop: bus.schedule[srcIdx],
              destStop: bus.schedule[destIdx],
              direction: 'reverse'
            });
          }
        }
      });
    });
  });
  
  // Remove duplicates (same bus appearing multiple times for different stop pairs)
  const uniqueBuses = [];
  const seenBuses = new Set();
  
  matchingBuses.forEach(bus => {
    const key = `${bus.registrationNumber}_${bus.sourceStop?.stopageName}_${bus.destStop?.stopageName}`;
    if (!seenBuses.has(key)) {
      seenBuses.add(key);
      uniqueBuses.push(bus);
    }
  });
  
  return uniqueBuses;
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