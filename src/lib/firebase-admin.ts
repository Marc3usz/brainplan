import * as admin from 'firebase-admin';

// Check if Firebase Admin has already been initialized
if (!admin.apps.length) {
  try {
    // Load service account from hardcoded value in environment
    const serviceAccount = {
      "type": "service_account",
      "project_id": "sigma-2667d",
      "private_key_id": "360405fb82ef7c502e767ee6cca282eeb5e90b27",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDPzXZpVu4oOTCm\nF+ehdAzAwS/5L48QixJDRBaIOB7DNF7A3a7qeyipYKAlTbwm7RiO3BcNpvBKwQgI\nvbb6Kj0ZieLAe1Ut2T4kbovTaNmhQf6xCPjtHHDXNOCP/KpXXDczeLsIMeOpVQgP\nlW+2skjz/AypDKJExSLWXNt44l/g9Au42UY9dd7z1s9JV/o6exA8iJFqGVayAl7g\nRZjRDA5IlNH1+j1to5IQs8T4dKSAmlKDusveMRtAjvjeKPmonFqyhIoYhPBXw0/Q\nLowUtv07bFI/LG/mal3cfdQKkrU9900WmqNZMYX+ahmrLUSUXfiXORcz6oc6BKzl\niClFkn/tAgMBAAECggEAFAqoKrk2X31CjqZcEfOIHlgTiSg311veX0v0E1+8Qc3t\nfJL04YsOzSUzVN22MZfo6DBcbdXls4QCAxvPB7omqe2lR7Stbq5W4rshs7pXUQj1\nKDxqC65USMFCDkkLYcEUVtvESCJNp4F6tUwPmfKAfD2ZN/2usczEkyGiDjrhDeg2\n+s88kFZ8vQA2Q06fYV+H7xKCOEZGgJWcJJCxFpGsV3J4QQ8OHc9+0m7S+4DjawsD\ncl/xC0d4upshWi5kw92C07al09VLBB7lBzCHAAN+WB07mPEKKr9mCpDc3PxEl5QE\npPbks0ShQuVDRrknOIlyQoTwEpdeHU8FEhA7LRT8UQKBgQD+qQTtffShZYqAUdz5\nmDTs2UoHXWLJfjbeXBWo6JMVNP8rHamE3wHX4Sg/hfrW18wvGC8Jgk3jDIT9nLfA\n1SFjT+m3hD/0yLtXm4HMNlg1iysmHnYbR5QumFCsAAO3JEIvEHRL+K1VJTF78JlG\n7OG0ijR0fzGKQeZfAFkQ67kXEQKBgQDQ5VWpvOu52wKN/H9HJa9MUgX6KBJyzQ7q\n7+hijq4ig8qjy8xGGvRyP2+ZUfVTeBWsscUc1yxvk2poO4yp93wxoJ0WyNXnOGbo\nwtpoQx43W2Fpw5f6+pxGqEo4GJt2wrxy/J7JQsEvVrwBmJR1eGVHgUekQQMeLF66\nEkpaYtqzHQKBgDec4Z6bqxiz/BMZzZAUVTqEGU6Sbkhib8kPgwtn/vbao/7ec264\n5MYoPYnh0G2qosSGG3+QHUJAMarQ1rAd2zS89uVE1FK4o3D2XNoj5A+NXNbuQAyl\nDQ8/5B4rwqP0Hx/4D+2nWPMHNE9Es7RxdrjelaX7QO5Yhd6pTMoNMFaBAoGBAKNd\nxwmQsrVN3wiVoCBPC3Hfb8c8UXkwfusjJhT1yp85fF9uwVlOOT+j9q3sF7ToY+MD\nv8iXSqwTmJLdh1thLeJN3qxz8jz6shh0UoRZgSb/swYYriHcnhzv/eMy81oEX4Z5\no+B38UcJSMziu6/GsUYjh5igM0UEpCxWo4leZ/TNAoGBAKZhhG1P+W5e1gt48zfs\nDKaQCqwxtfogqw60KK5dmErH+iMpbsQGngGxWd8JhNECdSCHPLI0Hb2Zwwj8H8zL\ncq+NeEy36QhuVprDKH/TPQZqeKiVDKqoHsqu9vHgk/i6DXvCaLBC7/hzbSXHOnLp\nAq8aUaYJoSDTaHY5veTWAADB\n-----END PRIVATE KEY-----\n",
      "client_email": "firebase-adminsdk-fbsvc@sigma-2667d.iam.gserviceaccount.com",
      "client_id": "109303472342967114981",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40sigma-2667d.iam.gserviceaccount.com",
      "universe_domain": "googleapis.com"
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
    
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    // Re-throw the error with a more descriptive message
    throw new Error(`Firebase Admin initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const firebaseAdmin = admin;
export const auth = admin.auth();
export const firestore = admin.firestore();