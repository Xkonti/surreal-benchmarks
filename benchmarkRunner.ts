import Surreal from "surrealdb";
import { sharedPassword, sharedUsername, type DatabaseDef } from "./database";
import { type BenchmarkDef, type QueryDef, type IterationResult, type BenchmarkTimingResult, getIterable } from "./benchmark";
import { mixSeeds } from "./utils";

export const initialSeed = 154871;

export async function runBenchmark(db: DatabaseDef, benchmark: BenchmarkDef): Promise<BenchmarkTimingResult> {
  let isBenchmarkSetup = false;
  
  let benchmarkResults: BenchmarkTimingResult = {
    iterationResults: []
  };

  // Run each query from the benchmark
  for (const iteration of Array(benchmark.iterations).keys()) {
    const iterationSeed = mixSeeds(initialSeed, iteration);
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

    // Run the benchmark setup queries if not already done
    if (!isBenchmarkSetup) {
      for (let benchmarkSetupIndex = 0; benchmarkSetupIndex < benchmark.benchmarkSetupQueries.length; benchmarkSetupIndex++) {
        const query = benchmark.benchmarkSetupQueries[benchmarkSetupIndex];
        const querySeed = mixSeeds(iterationSeed, benchmarkSetupIndex);
        await runUtilityQuery(database, query, querySeed);
      }
      isBenchmarkSetup = true;
    }

    // Run the iteration setup queries
    for (let iterationSetupIndex = 0; iterationSetupIndex < benchmark.iterationSetupQueries.length; iterationSetupIndex++) {
      const query = benchmark.iterationSetupQueries[iterationSetupIndex];
      const querySeed = mixSeeds(iterationSeed, iterationSetupIndex);
      await runUtilityQuery(database, query, querySeed);
    }

    let iterationResults: IterationResult = {
      timePerQuery: []
    }

    // Run each query from the benchmark
    for (let i = 0; i < benchmark.queries.length; i++) {
    
      const query = benchmark.queries[i];
      const querySeed = mixSeeds(iterationSeed, i);
      let times = await runQuery(database, query, querySeed);
      // If the query failes, we need to start over
      if (times.length == 0) {
        // Finish the iteration
        break;
      }
      iterationResults.timePerQuery.push(...times);
    }

    // Run the iteration teardown queries
    for (let iterationTeardownIndex = 0; iterationTeardownIndex < benchmark.iterationTeardownQueries.length; iterationTeardownIndex++) {
      const query = benchmark.iterationTeardownQueries[iterationTeardownIndex];
      const querySeed = mixSeeds(iterationSeed, iterationTeardownIndex);
      await runUtilityQuery(database, query, querySeed);
    }

    // Run the benchmark teardown queries if this is the last iteration
    if (iteration == benchmark.iterations - 1) {
      for (let benchmarkTeardownIndex = 0; benchmarkTeardownIndex < benchmark.benchmarkTeardownQueries.length; benchmarkTeardownIndex++) {
        const query = benchmark.benchmarkTeardownQueries[benchmarkTeardownIndex];
        const querySeed = mixSeeds(iterationSeed, benchmarkTeardownIndex);
        await runUtilityQuery(database, query, querySeed);
      }
    }

    await database.close();
    benchmarkResults.iterationResults.push(iterationResults);
  }

  return benchmarkResults;
}

/// Runs a query which doesn't keep track of time nor return results
async function runUtilityQuery(conn: Surreal, query: QueryDef, seed: number): Promise<void> {
  let queries = getIterable(query, seed);
  for await (const queryString of queries) {
    await conn.query_raw(queryString);
  }
}

async function runQuery(conn: Surreal, query: QueryDef, seed: number): Promise<number[]> {
  let queries = getIterable(query, seed);
  let times: number[] = [];

  for await (const queryString of queries) {
    let results = await conn.query_raw(queryString);
    if (results.length == 0) {
      console.error("Query returned no results.");
      return [];
    }


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