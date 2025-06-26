"use client";

import { useState, useEffect } from "react";
import { Plus, Database, Play, Trash2, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Playground {
  id: string;
  title: string;
  createdAt: string;
  lastQuery?: string;
  language: "sql" | "python" | "javascript" | "c"; // Add 'c' here
}

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
  output?: string; // Add output field for non-SQL languages
  type: "table" | "output"; // Add result type
}

interface QueryHistory {
  id: string;
  query: string;
  timestamp: string;
  result?: QueryResult;
  error?: string;
}

const exampleQueries = [
  {
    title: "View all users",
    query: "SELECT * FROM users;",
    description: "Display all users in the database",
  },
  {
    title: "Users with their order count",
    query: `SELECT 
  u.name, 
  u.email, 
  COUNT(o.id) as order_count,
  COALESCE(SUM(o.amount), 0) as total_spent
FROM users u 
LEFT JOIN orders o ON u.id = o.user_id 
GROUP BY u.id, u.name, u.email
ORDER BY total_spent DESC;`,
    description: "Show users with their order statistics",
  },
  {
    title: "Recent orders with user details",
    query: `SELECT 
  o.id,
  u.name as customer_name,
  o.product,
  o.amount,
  o.order_date
FROM orders o
JOIN users u ON o.user_id = u.id
ORDER BY o.order_date DESC;`,
    description: "Display recent orders with customer information",
  },
  {
    title: "Users by age group",
    query: `SELECT 
  CASE 
    WHEN age < 25 THEN 'Under 25'
    WHEN age BETWEEN 25 AND 30 THEN '25-30'
    WHEN age > 30 THEN 'Over 30'
    ELSE 'Unknown'
  END as age_group,
  COUNT(*) as user_count
FROM users
GROUP BY age_group;`,
    description: "Group users by age categories",
  },
  {
    title: "Top selling products",
    query: `SELECT 
  product,
  COUNT(*) as times_ordered,
  SUM(amount) as total_revenue
FROM orders
GROUP BY product
ORDER BY total_revenue DESC;`,
    description: "Find the most popular and profitable products",
  },
];

const exampleQueriesByLanguage = {
  sql: [
    {
      title: "View all users",
      query: "SELECT * FROM users;",
      description: "Display all users in the database",
    },
    {
      title: "Users with their order count",
      query: `SELECT 
  u.name, 
  u.email, 
  COUNT(o.id) as order_count,
  COALESCE(SUM(o.amount), 0) as total_spent
FROM users u 
LEFT JOIN orders o ON u.id = o.user_id 
GROUP BY u.id, u.name, u.email
ORDER BY total_spent DESC;`,
      description: "Show users with their order statistics",
    },
    {
      title: "Recent orders with user details",
      query: `SELECT 
  o.id,
  u.name as customer_name,
  o.product,
  o.amount,
  o.order_date
FROM orders o
JOIN users u ON o.user_id = u.id
ORDER BY o.order_date DESC;`,
      description: "Display recent orders with customer information",
    },
    {
      title: "Users by age group",
      query: `SELECT 
  CASE 
    WHEN age < 25 THEN 'Under 25'
    WHEN age BETWEEN 25 AND 30 THEN '25-30'
    WHEN age > 30 THEN 'Over 30'
    ELSE 'Unknown'
  END as age_group,
  COUNT(*) as user_count
FROM users
GROUP BY age_group;`,
      description: "Group users by age categories",
    },
    {
      title: "Top selling products",
      query: `SELECT 
  product,
  COUNT(*) as times_ordered,
  SUM(amount) as total_revenue
FROM orders
GROUP BY product
ORDER BY total_revenue DESC;`,
      description: "Find the most popular and profitable products",
    },
  ],
  python: [
    {
      title: "Hello World",
      query: `print("Hello, Python Playground!")
print("Current time:", __import__('datetime').datetime.now())`,
      description: "Basic Python output and datetime",
    },
    {
      title: "Data Analysis with Lists",
      query: `# Sample data analysis
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
print(f"Numbers: {numbers}")
print(f"Sum: {sum(numbers)}")
print(f"Average: {sum(numbers) / len(numbers)}")
print(f"Even numbers: {[n for n in numbers if n % 2 == 0]}")`,
      description: "Basic data manipulation and list comprehensions",
    },
    {
      title: "Working with JSON",
      query: `import json

# Sample data
data = {
    "users": [
        {"name": "John", "age": 30, "city": "New York"},
        {"name": "Jane", "age": 25, "city": "San Francisco"},
        {"name": "Bob", "age": 35, "city": "Chicago"}
    ]
}

print("Original data:")
print(json.dumps(data, indent=2))

# Filter users over 25
adults = [user for user in data["users"] if user["age"] > 25]
print(f"\\nUsers over 25: {len(adults)}")
for user in adults:
    print(f"- {user['name']} ({user['age']}) from {user['city']}")`,
      description: "JSON manipulation and data filtering",
    },
  ],
  javascript: [
    {
      title: "Hello World",
      query: `console.log("Hello, JavaScript Playground!");
console.log("Current time:", new Date().toISOString());`,
      description: "Basic JavaScript output and date handling",
    },
    {
      title: "Array Operations",
      query: `// Sample data manipulation
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
console.log("Numbers:", numbers);
console.log("Sum:", numbers.reduce((a, b) => a + b, 0));
console.log("Average:", numbers.reduce((a, b) => a + b, 0) / numbers.length);
console.log("Even numbers:", numbers.filter(n => n % 2 === 0));

// Working with objects
const users = [
  { name: "John", age: 30, city: "New York" },
  { name: "Jane", age: 25, city: "San Francisco" },
  { name: "Bob", age: 35, city: "Chicago" }
];

console.log("\\nUsers over 25:");
users
  .filter(user => user.age > 25)
  .forEach(user => console.log(\`- \${user.name} (\${user.age}) from \${user.city}\`));`,
      description: "Array methods and object manipulation",
    },
    {
      title: "Async Operations",
      query: `// Simulating async operations
async function fetchUserData(userId) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return { id: userId, name: \`User \${userId}\`, active: Math.random() > 0.5 };
}

async function main() {
  console.log("Fetching user data...");
  
  const userIds = [1, 2, 3, 4, 5];
  const users = await Promise.all(userIds.map(fetchUserData));
  
  console.log("All users:", users);
  console.log("Active users:", users.filter(u => u.active));
  console.log("Inactive users:", users.filter(u => !u.active));
}

main().catch(console.error);`,
      description: "Async/await and Promise handling",
    },
  ],
  c: [
    {
      title: "Hello World",
      query: `#include <stdio.h>

int main() {
    printf("Hello, C Playground!\\n");
    printf("Welcome to C programming!\\n");
    return 0;
}`,
      description: "Basic C program with printf output",
    },
    {
      title: "Variables and Data Types",
      query: `#include <stdio.h>

int main() {
    int age = 25;
    float height = 5.9;
    char grade = 'A';
    char name[] = "John Doe";
    
    printf("Name: %s\\n", name);
    printf("Age: %d years\\n", age);
    printf("Height: %.1f feet\\n", height);
    printf("Grade: %c\\n", grade);
    
    return 0;
}`,
      description: "Working with different data types in C",
    },
    {
      title: "Arrays and Loops",
      query: `#include <stdio.h>

int main() {
    int numbers[] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    int size = sizeof(numbers) / sizeof(numbers[0]);
    int sum = 0;
    
    printf("Numbers: ");
    for (int i = 0; i < size; i++) {
        printf("%d ", numbers[i]);
        sum += numbers[i];
    }
    
    printf("\\nSum: %d\\n", sum);
    printf("Average: %.2f\\n", (float)sum / size);
    
    // Find even numbers
    printf("Even numbers: ");
    for (int i = 0; i < size; i++) {
        if (numbers[i] % 2 == 0) {
            printf("%d ", numbers[i]);
        }
    }
    printf("\\n");
    
    return 0;
}`,
      description: "Array manipulation and loop structures",
    },
    {
      title: "Functions and Recursion",
      query: `#include <stdio.h>

// Function to calculate factorial
int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

// Function to check if number is prime
int isPrime(int n) {
    if (n <= 1) return 0;
    if (n <= 3) return 1;
    if (n % 2 == 0 || n % 3 == 0) return 0;
    
    for (int i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) {
            return 0;
        }
    }
    return 1;
}

int main() {
    int num = 5;
    
    printf("Factorial of %d: %d\\n", num, factorial(num));
    
    printf("Prime numbers from 1 to 20: ");
    for (int i = 1; i <= 20; i++) {
        if (isPrime(i)) {
            printf("%d ", i);
        }
    }
    printf("\\n");
    
    return 0;
}`,
      description: "Functions, recursion, and mathematical operations",
    },
    {
      title: "Structures and Pointers",
      query: `#include <stdio.h>
#include <string.h>

struct Student {
    char name[50];
    int age;
    float gpa;
};

void printStudent(struct Student *s) {
    printf("Name: %s\\n", s->name);
    printf("Age: %d\\n", s->age);
    printf("GPA: %.2f\\n", s->gpa);
}

int main() {
    struct Student students[3];
    
    // Initialize students
    strcpy(students[0].name, "Alice");
    students[0].age = 20;
    students[0].gpa = 3.8;
    
    strcpy(students[1].name, "Bob");
    students[1].age = 22;
    students[1].gpa = 3.5;
    
    strcpy(students[2].name, "Charlie");
    students[2].age = 21;
    students[2].gpa = 3.9;
    
    printf("Student Information:\\n");
    printf("==================\\n");
    
    for (int i = 0; i < 3; i++) {
        printf("Student %d:\\n", i + 1);
        printStudent(&students[i]);
        printf("\\n");
    }
    
    return 0;
}`,
      description: "Structures, pointers, and memory management",
    },
  ],
};

export default function SQLPlayground() {
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
  const [selectedPlayground, setSelectedPlayground] =
    useState<Playground | null>(null);
  const [query, setQuery] = useState("");
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [currentResult, setCurrentResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [showExamples, setShowExamples] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<
    "sql" | "python" | "javascript" | "c"
  >("sql");

  // Load playgrounds on mount
  useEffect(() => {
    loadPlaygrounds();
  }, []);

  // Load query history when playground changes
  useEffect(() => {
    if (selectedPlayground) {
      loadQueryHistory(selectedPlayground.id);
    }
  }, [selectedPlayground]);

  const loadPlaygrounds = async () => {
    try {
      const response = await fetch("/api/playgrounds");
      const data = await response.json();
      setPlaygrounds(data);
    } catch (err) {
      console.error("Failed to load playgrounds:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadQueryHistory = async (playgroundId: string) => {
    try {
      const response = await fetch(`/api/playgrounds/${playgroundId}/history`);
      const data = await response.json();
      setQueryHistory(data);
    } catch (err) {
      console.error("Failed to load query history:", err);
    }
  };

  const createPlayground = async () => {
    try {
      const response = await fetch("/api/playgrounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${selectedLanguage.toUpperCase()} Playground ${
            playgrounds.length + 1
          }`,
          language: selectedLanguage,
        }),
      });
      const newPlayground = await response.json();
      setPlaygrounds([...playgrounds, newPlayground]);
      setSelectedPlayground(newPlayground);
    } catch (err) {
      console.error("Failed to create playground:", err);
    }
  };

  const deletePlayground = async (id: string) => {
    try {
      await fetch(`/api/playgrounds/${id}`, { method: "DELETE" });
      setPlaygrounds(playgrounds.filter((p) => p.id !== id));
      if (selectedPlayground?.id === id) {
        setSelectedPlayground(null);
        setQuery("");
        setCurrentResult(null);
        setQueryHistory([]);
      }
    } catch (err) {
      console.error("Failed to delete playground:", err);
    }
  };

  const updatePlaygroundTitle = async (id: string, title: string) => {
    try {
      const response = await fetch(`/api/playgrounds/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const updatedPlayground = await response.json();
      setPlaygrounds(
        playgrounds.map((p) => (p.id === id ? updatedPlayground : p))
      );
      if (selectedPlayground?.id === id) {
        setSelectedPlayground(updatedPlayground);
      }
      setEditingTitle(null);
    } catch (err) {
      console.error("Failed to update playground:", err);
    }
  };

  const executeQuery = async () => {
    if (!selectedPlayground || !query.trim()) return;

    setIsExecuting(true);
    setError(null);
    setCurrentResult(null);

    try {
      const response = await fetch(
        `/api/playgrounds/${selectedPlayground.id}/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
      } else {
        setCurrentResult(data.result);
        loadQueryHistory(selectedPlayground.id);
      }
    } catch (err) {
      setError("Failed to execute query");
    } finally {
      setIsExecuting(false);
    }
  };

  const startEditing = (playground: Playground) => {
    setEditingTitle(playground.id);
    setNewTitle(playground.title);
  };

  const saveTitle = () => {
    if (editingTitle && newTitle.trim()) {
      updatePlaygroundTitle(editingTitle, newTitle.trim());
    }
  };

  const cancelEditing = () => {
    setEditingTitle(null);
    setNewTitle("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Database className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-gray-600">Loading Playground...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Multi-Language Code Playground
          </h1>
          <p className="text-gray-600">
            Create, manage, and execute code in SQL, Python, JavaScript, and C
            environments
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Playgrounds List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Playgrounds</CardTitle>
                  <Button onClick={createPlayground} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>
                  Manage your coding environments
                </CardDescription>
                <div className="flex gap-1 mt-3">
                  {(["sql", "python", "javascript", "c"] as const).map(
                    (lang) => (
                      <Button
                        key={lang}
                        size="sm"
                        variant={
                          selectedLanguage === lang ? "default" : "outline"
                        }
                        onClick={() => setSelectedLanguage(lang)}
                        className="text-xs"
                      >
                        {lang.toUpperCase()}
                      </Button>
                    )
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {playgrounds.map((playground) => (
                  <div
                    key={playground.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPlayground?.id === playground.id
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedPlayground(playground)}
                  >
                    <div className="flex items-center justify-between">
                      {editingTitle === playground.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="h-6 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveTitle();
                              if (e.key === "Escape") cancelEditing();
                            }}
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" onClick={saveTitle}>
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <h3 className="font-medium text-sm">
                              {playground.title}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {new Date(
                                playground.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(playground);
                              }}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePlayground(playground.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {playgrounds.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No playgrounds yet. Create your first one!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedPlayground ? (
              <div className="space-y-6">
                {/* Query Editor */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Database className="w-5 h-5" />
                          {selectedPlayground.title}
                          <Badge variant="outline">
                            {selectedPlayground.language?.toUpperCase() ||
                              "SQL"}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Write and execute your{" "}
                          {selectedPlayground.language || "SQL"} code
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowExamples(!showExamples)}
                      >
                        {showExamples ? "Hide Examples" : "Show Examples"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedPlayground.language === "sql" ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">
                          📊 Sample Data Available
                        </h4>
                        <div className="text-sm text-blue-800 space-y-1">
                          <p>
                            <strong>users</strong> table: id, name, email, age,
                            created_at (4 sample users)
                          </p>
                          <p>
                            <strong>orders</strong> table: id, user_id, product,
                            amount, order_date (5 sample orders)
                          </p>
                        </div>
                      </div>
                    ) : selectedPlayground.language === "c" ? (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h4 className="font-medium text-orange-900 mb-2">
                          ⚡ C Compiler Ready
                        </h4>
                        <div className="text-sm text-orange-800">
                          <p>
                            GCC compiler with standard C library support. Code
                            is compiled and executed safely.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-900 mb-2">
                          🚀{" "}
                          {selectedPlayground.language === "python"
                            ? "Python"
                            : "JavaScript"}{" "}
                          Environment Ready
                        </h4>
                        <div className="text-sm text-green-800">
                          <p>
                            {selectedPlayground.language === "python"
                              ? "Full Python environment with standard library access"
                              : "Node.js environment with ES6+ support and built-in modules"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Example Queries */}
                    {showExamples && (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-medium mb-3">
                          💡 Example{" "}
                          {selectedPlayground.language?.toUpperCase() || "SQL"}{" "}
                          Code to Try
                        </h4>
                        <div className="space-y-3">
                          {exampleQueriesByLanguage[
                            selectedPlayground.language || "sql"
                          ].map((example, index) => (
                            <div
                              key={index}
                              className="bg-white border rounded p-3"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-sm">
                                  {example.title}
                                </h5>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setQuery(example.query)}
                                >
                                  Use Code
                                </Button>
                              </div>
                              <p className="text-xs text-gray-600 mb-2">
                                {example.description}
                              </p>
                              <code className="text-xs bg-gray-100 p-2 rounded block overflow-x-auto whitespace-pre">
                                {example.query}
                              </code>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Textarea
                      placeholder={`Enter your ${
                        selectedPlayground.language || "SQL"
                      } code here... (Try clicking 'Show Examples' above for sample code)`}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="min-h-32 font-mono"
                    />
                    <Button
                      onClick={executeQuery}
                      disabled={isExecuting || !query.trim()}
                    >
                      {isExecuting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Execute Query
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Error Display */}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Results */}
                {currentResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Execution Results</CardTitle>
                      <CardDescription>
                        {currentResult.type === "table"
                          ? `${currentResult.rowCount} rows returned in ${currentResult.executionTime}ms`
                          : `Executed in ${currentResult.executionTime}ms`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {currentResult.type === "table" ? (
                        currentResult.rows.length > 0 ? (
                          <div className="overflow-auto max-h-96">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  {currentResult.columns.map((column) => (
                                    <TableHead key={column}>{column}</TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {currentResult.rows.map((row, index) => (
                                  <TableRow key={index}>
                                    {row.map((cell, cellIndex) => (
                                      <TableCell key={cellIndex}>
                                        {cell === null ? (
                                          <Badge variant="secondary">
                                            NULL
                                          </Badge>
                                        ) : (
                                          String(cell)
                                        )}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-4">
                            No rows returned
                          </p>
                        )
                      ) : (
                        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-96 overflow-auto">
                          {currentResult.output || "No output"}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Query History */}
                {queryHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Query History</CardTitle>
                      <CardDescription>
                        Recent queries for this playground
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {queryHistory.slice(0, 5).map((historyItem) => (
                          <div
                            key={historyItem.id}
                            className="border rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">
                                {new Date(
                                  historyItem.timestamp
                                ).toLocaleString()}
                              </Badge>
                              {historyItem.error ? (
                                <Badge variant="destructive">Error</Badge>
                              ) : (
                                <Badge variant="default">Success</Badge>
                              )}
                            </div>
                            <code className="text-sm bg-gray-100 p-2 rounded block">
                              {historyItem.query}
                            </code>
                            {historyItem.result && (
                              <p className="text-xs text-gray-500 mt-2">
                                {historyItem.result.rowCount} rows in{" "}
                                {historyItem.result.executionTime}ms
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Playground Selected
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Select a playground from the sidebar or create a new one to
                    get started. Each playground comes with sample data (users &
                    orders tables) ready to query!
                  </p>
                  <Button onClick={createPlayground}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Playground
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
