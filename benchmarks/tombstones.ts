import { type BenchmarkDef, type QueryDef } from "../benchmark";

const repetitions = 100;
const recordsPerRepetition = 5000;

/**
 * This benchmark measures how the performance degrades when a lot of records are being created and deleted repeatedly.
 */
export const tombstonesBenchmark: BenchmarkDef = {
  name: "tombstones",
  namespace: "tombstones",
  benchmarkSetupQueries: [],
  benchmarkTeardownQueries: [],
  iterationSetupQueries: [],
  iterationTeardownQueries: [],
  queries: [{
    name: "create and delete records",
    query: genCreateQueries,
  }],
  iterations: 1,
  numberOfConnections: 1,
};

/**
 * Generates the queries to create and delete the records repetitively.
 */
async function* genCreateQueries(seed: number): AsyncGenerator<string> {
  // Ignoring the seed as it's not necessary for this benchmark
  for (let i = 0; i < repetitions; i++) {
    yield /**surql**/`
        CREATE |testtombstones:${recordsPerRepetition}| SET numberA = rand::int(-10000, 10000), stringA = "Hello there!", objectA = {"a": 1, "b": "2", "c": 3.1415} RETURN NULL;
        DELETE testtombstones;
        `;
  }
}