import { type NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import Database from "better-sqlite3";
import path from "path";
import { spawn } from "child_process";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { tmpdir } from "os";

const dbPath = path.join(process.cwd(), "playground.db");
const db = new Database(dbPath);

function getPlaygroundDb(playgroundId: string) {
  const playgroundDbPath = path.join(
    process.cwd(),
    `playground_${playgroundId}.db`
  );
  const playgroundDb = new Database(playgroundDbPath);

  try {
    const tables = playgroundDb
      .prepare(
        `
      SELECT name FROM sqlite_master WHERE type='table'
    `
      )
      .all();

    if (tables.length === 0) {
      playgroundDb.exec(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          age INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          product TEXT NOT NULL,
          amount DECIMAL(10,2),
          order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );

        INSERT INTO users (name, email, age) VALUES
          ('John Doe', 'john@example.com', 30),
          ('Jane Smith', 'jane@example.com', 25),
          ('Bob Johnson', 'bob@example.com', 35),
          ('Alice Brown', 'alice@example.com', 28);

        INSERT INTO orders (user_id, product, amount) VALUES
          (1, 'Laptop', 999.99),
          (1, 'Mouse', 29.99),
          (2, 'Keyboard', 79.99),
          (3, 'Monitor', 299.99),
          (4, 'Headphones', 149.99);
      `);
    }
  } catch (error) {
    console.error("Error initializing playground database:", error);
  }

  return playgroundDb;
}

async function executePython(
  code: string
): Promise<{ output: string; error?: string }> {
  return new Promise((resolve) => {
    const tempFile = path.join(
      tmpdir(),
      `python_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.py`
    );

    try {
      writeFileSync(tempFile, code);

      const python = spawn("python3", [tempFile], {
        timeout: 10000, // 10 second timeout
      });

      let output = "";
      let errorOutput = "";

      python.stdout.on("data", (data) => {
        output += data.toString();
      });

      python.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      python.on("close", (code) => {
        if (existsSync(tempFile)) {
          unlinkSync(tempFile);
        }

        if (code !== 0 || errorOutput) {
          resolve({
            output: output || errorOutput,
            error: errorOutput || `Process exited with code ${code}`,
          });
        } else {
          resolve({ output: output || "(No output)" });
        }
      });

      python.on("error", (err) => {
        if (existsSync(tempFile)) {
          unlinkSync(tempFile);
        }
        resolve({
          output: "",
          error: `Failed to execute Python: ${err.message}`,
        });
      });
    } catch (err: any) {
      resolve({
        output: "",
        error: `Failed to create temp file: ${err.message}`,
      });
    }
  });
}

async function executeJavaScript(
  code: string
): Promise<{ output: string; error?: string }> {
  return new Promise((resolve) => {
    const tempFile = path.join(
      tmpdir(),
      `js_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.js`
    );

    try {
      writeFileSync(tempFile, code);

      const node = spawn("node", [tempFile], {
        timeout: 10000, // 10 second timeout
      });

      let output = "";
      let errorOutput = "";

      node.stdout.on("data", (data) => {
        output += data.toString();
      });

      node.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      node.on("close", (code) => {
        // Clean up temp file
        if (existsSync(tempFile)) {
          unlinkSync(tempFile);
        }

        if (code !== 0 || errorOutput) {
          resolve({
            output: output || errorOutput,
            error: errorOutput || `Process exited with code ${code}`,
          });
        } else {
          resolve({ output: output || "(No output)" });
        }
      });

      node.on("error", (err) => {
        if (existsSync(tempFile)) {
          unlinkSync(tempFile);
        }
        resolve({
          output: "",
          error: `Failed to execute JavaScript: ${err.message}`,
        });
      });
    } catch (err: any) {
      resolve({
        output: "",
        error: `Failed to create temp file: ${err.message}`,
      });
    }
  });
}

async function executeC(
  code: string
): Promise<{ output: string; error?: string }> {
  return new Promise((resolve) => {
    const tempDir = path.join(
      tmpdir(),
      `c_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    );
    const sourceFile = path.join(tempDir, "main.c");
    const executableFile = path.join(tempDir, "main");

    try {
      if (!existsSync(tempDir)) {
        require("fs").mkdirSync(tempDir, { recursive: true });
      }

      writeFileSync(sourceFile, code);

      const gcc = spawn("gcc", ["-o", executableFile, sourceFile, "-std=c99"], {
        timeout: 10000, // 10 second timeout for compilation
      });

      let compileOutput = "";
      let compileError = "";

      gcc.stdout.on("data", (data) => {
        compileOutput += data.toString();
      });

      gcc.stderr.on("data", (data) => {
        compileError += data.toString();
      });

      gcc.on("close", (code) => {
        if (code !== 0) {

          try {
            require("fs").rmSync(tempDir, { recursive: true, force: true });
          } catch (e) {}

          resolve({
            output: compileError || compileOutput,
            error: `Compilation failed: ${
              compileError || "Unknown compilation error"
            }`,
          });
          return;
        }

        const executable = spawn(executableFile, [], {
          timeout: 5000, // 5 second timeout for execution
          cwd: tempDir,
        });

        let output = "";
        let errorOutput = "";

        executable.stdout.on("data", (data) => {
          output += data.toString();
        });

        executable.stderr.on("data", (data) => {
          errorOutput += data.toString();
        });

        executable.on("close", (execCode) => {
          try {
            require("fs").rmSync(tempDir, { recursive: true, force: true });
          } catch (e) {}

          if (execCode !== 0 || errorOutput) {
            resolve({
              output: output || errorOutput,
              error: errorOutput || `Program exited with code ${execCode}`,
            });
          } else {
            resolve({ output: output || "(No output)" });
          }
        });

        executable.on("error", (err) => {
          try {
            require("fs").rmSync(tempDir, { recursive: true, force: true });
          } catch (e) {}
          resolve({
            output: "",
            error: `Failed to execute C program: ${err.message}`,
          });
        });
      });

      gcc.on("error", (err) => {
        try {
          require("fs").rmSync(tempDir, { recursive: true, force: true });
        } catch (e) {}
        resolve({
          output: "",
          error: `Failed to compile C code: ${err.message}`,
        });
      });
    } catch (err: any) {
      try {
        require("fs").rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {}
      resolve({
        output: "",
        error: `Failed to create temp files: ${err.message}`,
      });
    }
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: playgroundId } = params;
    const { query } = await request.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const playground = db
      .prepare("SELECT language FROM playgrounds WHERE id = ?")
      .get(playgroundId) as { language: string } | undefined;

    if (!playground) {
      return NextResponse.json(
        { error: "Playground not found" },
        { status: 404 }
      );
    }

    const startTime = Date.now();
    let result = null;
    let error = null;

    try {
      if (playground.language === "sql") {
        const playgroundDb = getPlaygroundDb(playgroundId);

        const trimmedQuery = query.trim().toLowerCase();

        if (
          trimmedQuery.startsWith("select") ||
          trimmedQuery.startsWith("with")
        ) {
          const stmt = playgroundDb.prepare(query);
          const rows = stmt.all();

          const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

          const rowsArray = rows.map((row) => columns.map((col) => row[col]));

          result = {
            columns,
            rows: rowsArray,
            rowCount: rows.length,
            executionTime: Date.now() - startTime,
            type: "table",
          };
        } else {
          const stmt = playgroundDb.prepare(query);
          const info = stmt.run();

          result = {
            columns: ["affected_rows", "last_insert_id"],
            rows: [[info.changes, info.lastInsertRowid || null]],
            rowCount: 1,
            executionTime: Date.now() - startTime,
            type: "table",
          };
        }

        playgroundDb.close();
      } else if (playground.language === "python") {
        const { output, error: execError } = await executePython(query);

        if (execError) {
          error = execError;
        } else {
          result = {
            output,
            executionTime: Date.now() - startTime,
            type: "output",
            columns: [],
            rows: [],
            rowCount: 0,
          };
        }
      } else if (playground.language === "javascript") {
        const { output, error: execError } = await executeJavaScript(query);

        if (execError) {
          error = execError;
        } else {
          result = {
            output,
            executionTime: Date.now() - startTime,
            type: "output",
            columns: [],
            rows: [],
            rowCount: 0,
          };
        }
      } else if (playground.language === "c") {
        const { output, error: execError } = await executeC(query);

        if (execError) {
          error = execError;
        } else {
          result = {
            output,
            executionTime: Date.now() - startTime,
            type: "output",
            columns: [],
            rows: [],
            rowCount: 0,
          };
        }
      } else {
        error = `Unsupported language: ${playground.language}`;
      }
    } catch (sqlError: any) {
      error = sqlError.message;
      result = null;
    }

    const executionTime = Date.now() - startTime;

    const historyId = uuidv4();
    const historyStmt = db.prepare(`
      INSERT INTO query_history (id, playground_id, query, result, error, execution_time)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    historyStmt.run(
      historyId,
      playgroundId,
      query,
      result ? JSON.stringify(result) : null,
      error,
      executionTime
    );

    // Update last query in playground
    const updateStmt = db.prepare(
      "UPDATE playgrounds SET last_query = ? WHERE id = ?"
    );
    updateStmt.run(query, playgroundId);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error executing code:", error);
    return NextResponse.json(
      { error: "Failed to execute code" },
      { status: 500 }
    );
  }
}
