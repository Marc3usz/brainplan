import { NextRequest, NextResponse } from "next/server";
import { generateVideo } from "@/lib/video-generator";

export async function POST(request: NextRequest) {
  try {
    const { text, summarize } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: "Text input is required" },
        { status: 400 }
      );
    }

    // Use our server-only function to generate the video
    const result = await generateVideo(text, summarize);

    if (!result?.publicUrl) {
      throw new Error("Failed to generate video");
    }

    // Return the video URL
    return NextResponse.json({
      videoUrl: result.publicUrl,
      message: "Video generated successfully"
    });
  } catch (error: any) {
    console.error("Error generating video:", error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred during video generation" },
      { status: 500 }
    );
  }
}