import { type NextRequest, NextResponse } from "next/server"
import Database from "better-sqlite3"
import path from "path"

const dbPath = path.join(process.cwd(), "playground.db")
const db = new Database(dbPath)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: playgroundId } = params

    const history = db
      .prepare(`
      SELECT 
        id,
        query,
        result,
        error,
        execution_time as executionTime,
        timestamp
      FROM query_history
      WHERE playground_id = ?
      ORDER BY timestamp DESC
      LIMIT 20
    `)
      .all(playgroundId)

    const parsedHistory = history.map((item) => ({
      ...item,
      result: item.result ? JSON.parse(item.result) : null,
    }))

    return NextResponse.json(parsedHistory)
  } catch (error) {
    console.error("Error fetching query history:", error)
    return NextResponse.json({ error: "Failed to fetch query history" }, { status: 500 })
  }
}
