import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import Database from "better-sqlite3"
import path from "path"

// Initialize SQLite database
const dbPath = path.join(process.cwd(), "playground.db")
const db = new Database(dbPath)

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS playgrounds (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    language TEXT DEFAULT 'sql',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_query TEXT
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS query_history (
    id TEXT PRIMARY KEY,
    playground_id TEXT NOT NULL,
    query TEXT NOT NULL,
    result TEXT,
    error TEXT,
    execution_time INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playground_id) REFERENCES playgrounds (id) ON DELETE CASCADE
  )
`)

export async function GET() {
  try {
    const playgrounds = db
      .prepare(`
  SELECT id, title, language, created_at as createdAt, last_query as lastQuery
  FROM playgrounds
  ORDER BY created_at DESC
`)
      .all()

    return NextResponse.json(playgrounds)
  } catch (error) {
    console.error("Error fetching playgrounds:", error)
    return NextResponse.json({ error: "Failed to fetch playgrounds" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, language = "sql" } = await request.json()
    const id = uuidv4()

    const stmt = db.prepare(`
      INSERT INTO playgrounds (id, title, language)
      VALUES (?, ?, ?)
    `)

    stmt.run(id, title, language)

    const playground = db
      .prepare(`
      SELECT id, title, language, created_at as createdAt, last_query as lastQuery
      FROM playgrounds
      WHERE id = ?
    `)
      .get(id)

    return NextResponse.json(playground)
  } catch (error) {
    console.error("Error creating playground:", error)
    return NextResponse.json({ error: "Failed to create playground" }, { status: 500 })
  }
}
