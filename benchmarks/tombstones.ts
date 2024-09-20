import { type BenchmarkDef, type QueryDef } from "../benchmark";

const repetitions = 100;
const recordsPerRepetition = 5000;

/**
 * This benchmark measures how the performance degrades when a lot of records are being created and deleted repeatedly.
 */
export const tombsontesBenchmark: BenchmarkDef = {
  name: "tombstones",
  namespace: "tombstones",
  queries: genCreateQueries(),
  iterations: 1,
  numberOfConnections: 1,
};

/**
 * Generates the queries to create and delete the records repetitively.
 */
function genCreateQueries(): QueryDef[] {
  let queries: QueryDef[] = [];
  for (let i = 0; i < repetitions; i++) {
    queries.push({
      name: `repetition ${i}`,
      query: /**surql**/`
        CREATE |testtombstones:${recordsPerRepetition}| SET numberA = rand::int(-10000, 10000), stringA = "Hello there!", objectA = {"a": 1, "b": "2", "c": 3.1415} RETURN NULL;
        DELETE testtombstones;
        `,
    });
  }
  return queries;
}