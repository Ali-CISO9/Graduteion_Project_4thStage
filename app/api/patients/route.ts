import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function GET() {
  try {
    // Forward to Python backend
    const backendResponse = await fetch(`${BACKEND_URL}/patients`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!backendResponse.ok) {
      throw new Error(`Backend error: ${backendResponse.status}`)
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Patients GET error:", error)
    return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 })
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Forward to Python backend
    const backendResponse = await fetch(`${BACKEND_URL}/patients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await backendResponse.json()

    if (!backendResponse.ok) {
      // Forward the specific error message from backend
      return NextResponse.json({ error: data.detail || "Failed to process patient data" }, { status: backendResponse.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Patients error:", error)
    return NextResponse.json({ error: "Failed to process patient data" }, { status: 500 })
  }
}