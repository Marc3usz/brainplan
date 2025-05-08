import { NextResponse } from "next/server";
import { generateResponse } from "@/services/ollama";
import { getToken } from 'next-auth/jwt';
import { auth } from '@/lib/firebase';
import { cookies } from 'next/headers';

// Configure CORS headers for the API route
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Calendar-Token',
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    // Verify authentication with NextAuth
    const token = await getToken({ req: request as any });
    
    // Check if user is authenticated via either NextAuth or Firebase auth cookie
    // This needs to check for cookies that indicate Firebase authentication
    const authHeader = request.headers.get('authorization');
    const firebaseToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    // Get calendar access token from header if available
    const calendarToken = request.headers.get('x-calendar-token');
    
    // Allow the request if either NextAuth token or Firebase token exists
    const isAuthenticated = !!token || !!firebaseToken;
    
    if (!isAuthenticated) {
      console.error("Authentication required: No valid token found");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401, headers: corsHeaders }
      );
    }

    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      // Pass calendar token to generateResponse function
      const response = await generateResponse(message, history, 0, { calendarToken });
      return NextResponse.json({ response }, { headers: corsHeaders });
    } catch (error) {
      console.error("Error generating response:", error);
      
      // Check for connection-related errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("EOF") || 
          errorMessage.includes("connection") || 
          errorMessage.includes("ECONNREFUSED")) {
        return NextResponse.json(
          { 
            error: "Failed to connect to the Ollama server", 
            details: errorMessage,
            solution: "Please ensure the Ollama service is running on your local machine"
          },
          { status: 503, headers: corsHeaders }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Failed to generate response",
          details: errorMessage 
        },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { 
        error: "Failed to process request",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
