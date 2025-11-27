import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function GET() {
  try {
    // Forward to Python backend
    const backendResponse = await fetch(`${BACKEND_URL}/patient-analyses`, {
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
    console.error("Patient analyses error:", error)
    return NextResponse.json({ error: "Failed to fetch patient analyses" }, { status: 500 })
  }
}