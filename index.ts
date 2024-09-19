import { runBenchmark } from "./benchmarkRunner";
import { benchmarksList } from "./benchmarks";
import { databases } from "./database";

console.log("Hello via Bun!");

for (const db of databases) {
  for (const benchmark of benchmarksList) {
    console.log("Starting benchmark", benchmark.name);
    let results = await runBenchmark(db, benchmark);
    console.log("Finished benchmark", benchmark.name);
    console.log("Results:", results);
  }
  
  // Dump the results of each query to a CSV file
}