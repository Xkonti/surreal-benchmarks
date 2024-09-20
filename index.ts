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
    // Save raw data to a CSV file
    writeToCSV(db.name, benchmark.name, "-raw", results, outputDir);
    let processedResults = processResults(results);
    // Save summary data to a CSV file
    writeToCSV(db.name, benchmark.name, "-summary", processedResults, outputDir);
  }
}