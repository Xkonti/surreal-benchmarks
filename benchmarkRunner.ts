import Surreal from "surrealdb";
import { sharedPassword, sharedUsername, type DatabaseDef } from "./database";
import type { BenchmarkDef, QueryDef, IterationResult, BenchmarkTimingResult } from "./benchmark";


export async function runBenchmark(db: DatabaseDef, benchmark: BenchmarkDef): Promise<BenchmarkTimingResult> {
  let benchmarkResults: BenchmarkTimingResult = {
    iterationResults: []
  };

  // Run each query from the benchmark
  for (const iteration of Array(benchmark.iterations).keys()) {
    console.log("Running iteration", iteration);

    // Create a new connection
    let database = new Surreal();
    try {
      await database.connect(`ws://${db.ip}:${db.port}/rpc`, {
        prepare: async (connection) => {
          const namespace = benchmark.namespace;
          const database = `iteration${iteration}`;
          await connection.use({ namespace, database });
          await connection.signin({ username: sharedUsername, password: sharedPassword });
        }
      });
      console.log("Connected and signed into database:", db.name);
    }
    catch (err) {
      console.error("Failed to connect to ", db.name, ":", err.message);
      throw err;
    }

    let iterationResults: IterationResult = {
      timePerQuery: []
    }

    for (const query of benchmark.queries) {
      let times = await runQuery(database, query);
      // If the query failes, we need to start over
      if (times.length == 0) {
        // Finish the iteration
        break;
      }
      iterationResults.timePerQuery.push(...times);
    }

    await database.close();
    benchmarkResults.iterationResults.push(iterationResults);
  }

  return benchmarkResults;
}


async function runQuery(conn: Surreal, query: QueryDef): Promise<string[]> {
  let results = await conn.query_raw(query.query);
  if (results.length == 0) {
    console.error("Query returned no results.");
    return [];
  }

  let times: string[] = [];

  for (const result of results) {
    if (result.status == "ERR") {
      console.error("Query failed:", result);
      times.push("ERR");
      continue;
    }

    console.log("Query", query.name, "took", result.time, "ms");
    times.push(result.time);
  }

  return times;
}