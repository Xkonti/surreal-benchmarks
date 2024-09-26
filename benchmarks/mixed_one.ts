import { type BenchmarkDef, type QueryDef } from "../benchmark";

const iterations = 1; // Do not repeat as this is a single iteration benchmark
const namespace = "mixed1";


const schemaSetupQuery: QueryDef = {
  name: "setup",
  query: loadSchemaAsString,
};

const teardownQuery: QueryDef = {
  name: "teardown",
  query: /**surql**/`
    REMOVE NAMESPACE ${namespace};
    `,
};

// export const mixed1Benchamrk: BenchmarkDef = {
//   name: "mixed1",
//   namespace: namespace,
//   benchmarkSetupQueries: [schemaSetupQuery],
//   benchmarkTeardownQueries: [teardownQuery],
//   iterationSetupQueries: [],
//   iterationTeardownQueries: [],
//   queries: [{
//     name: "create and delete records",
//     query: genCreateQueries,
//   }],
//   iterations: 1,
//   numberOfConnections: 1,
// };

async function* loadSchemaAsString(_: number): AsyncGenerator<string> {
  const query = Bun.file("mixed_one_schema.surql");
  yield await query.text();
}