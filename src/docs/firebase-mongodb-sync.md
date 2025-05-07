# Firebase to MongoDB User Synchronization

This document explains how user data is synchronized between Firebase Authentication and MongoDB in our application.

## Overview

When a user authenticates with Firebase, we automatically create or update a corresponding user record in MongoDB. This ensures that we have consistent user data across both systems.

## Implementation Details

### 1. User Creation

When a user is created in Firebase (via email/password signup or OAuth providers), we:
1. Create a Firebase user account
2. Generate a Firebase auth token
3. Call our sync API endpoint with the user data and token
4. Create a corresponding user in MongoDB with the Firebase UID stored

### 2. User Authentication

When a user logs in:
1. Firebase authenticates the user
2. We call the sync API endpoint to ensure the MongoDB user is up-to-date
3. User data is synchronized between Firebase and MongoDB

### 3. User Profile Updates

When a user updates their profile:
1. The changes are saved in Firebase
2. The sync API is called to update the MongoDB user data

### 4. API Endpoints

- `/api/auth/sync`: Main synchronization endpoint that creates or updates MongoDB users
- `/api/auth/firebase-signup`: Endpoint for creating new users with Firebase and MongoDB
- `/api/auth/firebase-auth-hook`: Webhook endpoint for Firebase auth events

### 5. Implementation Files

- `src/services/firebaseAuthService.ts`: Main service for Firebase auth operations
- `src/services/userService.ts`: Handles MongoDB user operations
- `src/models/User.ts`: MongoDB user model with Firebase UID field

## Integration Points

### Client-Side

The `firebaseAuthService.ts` file handles all Firebase auth operations and ensures MongoDB synchronization by:
1. Calling the sync API after user operations
2. Storing user data in localStorage for client-side persistence
3. Setting auth cookies for server-side detection

### Server-Side

The API endpoints verify Firebase auth tokens and:
1. Create or update users in MongoDB
2. Return user data with MongoDB IDs
3. Handle auth events from Firebase

## Best Practices

- Always use the Firebase auth service functions for user operations
- Do not directly create users in MongoDB without Firebase UID
- Ensure that the Firebase Admin SDK is properly configured for token verification

## Security Considerations

- All API endpoints verify Firebase auth tokens
- MongoDB user operations require authentication
- User passwords are never stored in plain text (Firebase handles auth, MongoDB stores hashed passwords) 