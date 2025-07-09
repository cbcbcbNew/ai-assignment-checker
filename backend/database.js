import sqlite3 from 'sqlite3';
import { hashPassword } from './auth.js';

let db;

// Initialize database
export const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database('./users.db', (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      
      // Create users table if it doesn't exist
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating table:', err);
          reject(err);
          return;
        }
        console.log('Database initialized');
        resolve();
      });
    });
  });
};

// Create a new user
export const createUser = async (email, password, name = null) => {
  return new Promise((resolve, reject) => {
    hashPassword(password).then(hashedPassword => {
      db.run(
        'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
        [email, hashedPassword, name],
        function(err) {
          if (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
              reject(new Error('Email already exists'));
            } else {
              reject(err);
            }
            return;
          }
          resolve({ id: this.lastID, email, name });
        }
      );
    }).catch(reject);
  });
};

// Get user by email
export const getUserByEmail = async (email) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
};

// Get user by ID
export const getUserById = async (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, email, name, created_at FROM users WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
};

// Update user profile
export const updateUser = async (id, updates) => {
  return new Promise((resolve, reject) => {
    const { name, email } = updates;
    db.run(
      'UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, email, id],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes > 0);
      }
    );
  });
}; 