import { type NextRequest, NextResponse } from "next/server"
import Database from "better-sqlite3"
import path from "path"

const dbPath = path.join(process.cwd(), "playground.db")
const db = new Database(dbPath)

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const stmt = db.prepare("DELETE FROM playgrounds WHERE id = ?")
    const result = stmt.run(id)

    if (result.changes === 0) {
      return NextResponse.json({ error: "Playground not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting playground:", error)
    return NextResponse.json({ error: "Failed to delete playground" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { title } = await request.json()

    const stmt = db.prepare("UPDATE playgrounds SET title = ? WHERE id = ?")
    const result = stmt.run(title, id)

    if (result.changes === 0) {
      return NextResponse.json({ error: "Playground not found" }, { status: 404 })
    }

    const playground = db
      .prepare(`
  SELECT id, title, language, created_at as createdAt, last_query as lastQuery
  FROM playgrounds
  WHERE id = ?
`)
      .get(id)

    return NextResponse.json(playground)
  } catch (error) {
    console.error("Error updating playground:", error)
    return NextResponse.json({ error: "Failed to update playground" }, { status: 500 })
  }
}
