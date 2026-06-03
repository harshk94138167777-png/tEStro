import mongoose from 'mongoose';

let connected = false;

const PLACEHOLDER_MARKERS = ['YOUR_ATLAS_PASSWORD', '<db_password>', '<password>'];

function hasPlaceholder(value) {
  if (!value) return false;
  return PLACEHOLDER_MARKERS.some((p) => value.includes(p));
}

/**
 * 1) MONGODB_URL / MONGO_URI wins when set (local or Atlas). Ignores stray MONGO_ATLAS_* from the OS.
 * 2) Else Atlas split vars (user + host + password).
 */
function resolveMongoUri() {
  const uriDirect = (process.env.MONGODB_URL || process.env.MONGO_URI || '').trim();
  if (uriDirect) {
    if (hasPlaceholder(uriDirect)) {
      throw new Error(
        'MongoDB URI contains a placeholder password. Fix MONGO_URI / MONGODB_URL in backend/.env, or use MONGO_ATLAS_* vars (see .env.example).'
      );
    }
    return uriDirect;
  }

  const user = (process.env.MONGO_ATLAS_USER || '').trim();
  const password = process.env.MONGO_ATLAS_PASSWORD ?? '';
  const host = (process.env.MONGO_ATLAS_HOST || '').trim();
  const dbName = (process.env.MONGO_DB_NAME || 'tEStroDB').trim() || 'tEStroDB';

  const anyAtlas = Boolean(user || host || password !== '');
  if (anyAtlas) {
    if (!user || !host) {
      throw new Error(
        'When using Atlas env vars, set both MONGO_ATLAS_USER and MONGO_ATLAS_HOST in backend/.env.'
      );
    }
    if (password === '' || hasPlaceholder(password)) {
      throw new Error(
        'Set MONGO_ATLAS_PASSWORD to your Atlas database user password and save backend/.env, or set MONGODB_URL for local MongoDB.'
      );
    }
    const u = encodeURIComponent(user);
    const p = encodeURIComponent(password);
    return `mongodb+srv://${u}:${p}@${host}/${encodeURIComponent(dbName)}?retryWrites=true&w=majority`;
  }

  throw new Error(
    'No MongoDB connection configured. Set MONGODB_URL (e.g. mongodb://127.0.0.1:27017/tEStroDB) or Atlas vars in backend/.env — see .env.example.'
  );
}

export async function connectDB() {
  const uri = resolveMongoUri();

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri, {
      dbName: process.env.MONGO_DB_NAME || 'tEStroDB',
    });
    connected = true;
    console.log('MongoDB connected successfully');
  } catch (err) {
    connected = false;
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
}

export function isDbConnected() {
  return connected && mongoose.connection.readyState === 1;
}

mongoose.connection.on('disconnected', () => {
  connected = false;
  console.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB runtime error:', err.message);
});
