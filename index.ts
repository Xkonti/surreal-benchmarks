import { mkdir } from "node:fs/promises";
import { runBenchmark } from "./benchmarkRunner";
import { benchmarksList } from "./benchmarks";
import { databases } from "./database";
import { writeToCSV } from "./csvWriter";
import { processResults } from "./resultsProcessor";

console.log("Hello via Bun!");

const currentData = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const outputDir = "./results/" + currentData;
await mkdir(outputDir, { recursive: true });


for (const db of databases) {
  for (const benchmark of benchmarksList) {
    console.log("Starting benchmark", benchmark.name);
    let results = await runBenchmark(db, benchmark);
    console.log("Finished benchmark", benchmark.name);
    // TODO: Save raw data to a CSV file
    writeToCSV(benchmark.name, db.name, results, outputDir);
    let processedResults = processResults(results);
    writeToCSV(benchmark.name + "-summary", db.name, processedResults, outputDir);
    // TODO: Calculate, totals, averages and standard deviations
    // TODO: Write precalculated results to a JSON file
    console.log("Results:", results);
  }
  
  // Dump the results of each query to a CSV file
}