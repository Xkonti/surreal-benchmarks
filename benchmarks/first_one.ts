import { type BenchmarkDef } from "../benchmark";

export const firstOne: BenchmarkDef = {
  name: "Fisrt benchmark for testing benchmarking",
  namespace: "firstone",
  queries: [
    {
      name: "define table",
      query: /**surql**/`DEFINE TABLE test1;`,
    },
    {
      name: "perform tests",
      query: /**surql**/`
        RETURN "Ready";
        CREATE |test1:10000| SET numberA = rand::int(-1000, 1000), numberB = rand::int(-1000, 1000), numberC = rand::int(-1000, 1000);
        SELECT * FROM test1;
        SELECT * FROM test1 WHERE numberA > numberB AND numberB > numberC;
        SELECT numberA AS result FROM test1 WHERE numberA > numberB AND numberB > numberC;
        `,
    },
    {
      name: "cleanup",
      query: /**surql**/ "DELETE test1; REMOVE TABLE test1;",
    }
  ],
  iterations: 2,
  numberOfConnections: 1,
};