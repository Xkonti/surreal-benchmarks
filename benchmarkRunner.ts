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


async function runQuery(conn: Surreal, query: QueryDef): Promise<number[]> {
  let results = await conn.query_raw(query.query);
  if (results.length == 0) {
    console.error("Query returned no results.");
    return [];
  }

  let times: number[] = [];

  for (const result of results) {
    if (result.status == "ERR") {
      console.error("Query failed:", result);
      times.push(-1);
      continue;
    }

    let timeNumber = toMs(result.time);
    console.log("Query", query.name, "took", timeNumber, "ms");
    times.push(timeNumber);
  }

  return times;
}

function toMs(time: string): number {
  // If the time string ends with `ms`, remove it and return as a number
  if (time.endsWith("µs")) {
    return parseFloat(time.slice(0, -2)) / 1000;
  }
  else if (time.endsWith("ms")) {
    return parseFloat(time.slice(0, -2));
  }
  else if (time.endsWith("s")) {
    return parseFloat(time.slice(0, -1)) * 1000;
  }
  else {
    throw new Error("Invalid time format (can't conver to ms): " + time);
  }
}