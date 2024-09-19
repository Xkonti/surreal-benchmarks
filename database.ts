export type DatabaseDef = {
  name: string;
  ip: string;
  port: number;
};

export const sharedUsername = "rootuser";
export const sharedPassword = "somepassword";

export const databases: DatabaseDef[] = [
  {
    name: "surreal-1-rocksdb",
    ip: "192.168.50.5",
    port: 14838,
  },
  {
    name: "surreal-1-rocksdb-ram",
    ip: "192.168.50.5",
    port: 14839,
  },
  {
    name: "surreal-1-memory",
    ip: "192.168.50.5",
    port: 14840,
  },
  {
    name: "surreal-2-rocksdb",
    ip: "192.168.50.5",
    port: 14841,
  },
  {
    name: "surreal-2-rocksdb-ram",
    ip: "192.168.50.5",
    port: 14842,
  },
  {
    name: "surreal-2-surrealkv",
    ip: "192.168.50.5",
    port: 14843,
  },
  {
    name: "surreal-2-surrealkv-ram",
    ip: "192.168.50.5",
    port: 14844,
  },
  {
    name: "surreal-2-memory",
    ip: "192.168.50.5",
    port: 14845,
  },
];

