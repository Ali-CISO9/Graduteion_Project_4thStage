import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type")

    let backendBody: FormData | string
    let backendHeaders: Record<string, string>

    if (contentType?.includes("multipart/form-data")) {
      // Handle file uploads
      backendBody = await request.formData()
      backendHeaders = {}
    } else {
      // Handle JSON data - convert to form data for backend
      const jsonData = await request.json()
      const formData = new FormData()
      formData.append("lab_values", JSON.stringify(jsonData))
      backendBody = formData
      backendHeaders = {}
    }

    // Forward the request to the Python backend
    const backendResponse = await fetch(`${BACKEND_URL}/analyze`, {
      method: "POST",
      body: backendBody,
      headers: backendHeaders,
    })

    if (!backendResponse.ok) {
      throw new Error(`Backend error: ${backendResponse.status}`)
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze data" }, { status: 500 })
  }
}
