import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function PUT(request: Request, { params }: { params: Promise<{ analysis_id: string }> }) {
  try {
    const { analysis_id } = await params
    const body = await request.json()

    const backendResponse = await fetch(`${BACKEND_URL}/patient-analyses/${analysis_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!backendResponse.ok) {
      throw new Error(`Backend error: ${backendResponse.status}`)
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Update patient analysis error:", error)
    return NextResponse.json({ error: "Failed to update patient analysis" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ analysis_id: string }> }) {
  try {
    const { analysis_id } = await params

    const backendResponse = await fetch(`${BACKEND_URL}/patient-analyses/${analysis_id}`, {
      method: "DELETE",
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
    console.error("Delete patient analysis error:", error)
    return NextResponse.json({ error: "Failed to delete patient analysis" }, { status: 500 })
  }
}