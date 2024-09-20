export type DatabaseDef = {
  name: string;
  ip: string;
  port: number;
};

export const sharedUsername = "rootuser";
export const sharedPassword = "somepassword";

export function genDBs(ip: string, serverName: string): DatabaseDef[] {
  return [
    {
      name: `${serverName}-surreal-1-rocksdb`,
      ip,
      port: 14838,
    },
    {
      name: `${serverName}-surreal-1-rocksdb-ram`,
      ip,
      port: 14839,
    },
    {
      name: `${serverName}-surreal-1-memory`,
      ip,
      port: 14840,
    },
    {
      name: `${serverName}-surreal-2-rocksdb`,
      ip,
      port: 14841,
    },
    {
      name: `${serverName}-surreal-2-rocksdb-ram`,
      ip,
      port: 14842,
    },
    {
      name: `${serverName}-surreal-2-surrealkv-ram`,
      ip,
      port: 14844,
    },
    {
      name: `${serverName}-surreal-2-memory`,
      ip,
      port: 14845,
    },
    {
      name: `${serverName}-surreal-2-surrealkv`,
      ip,
      port: 14843,
    },
  ];
}

export const databases: DatabaseDef[] = [
  ...genDBs("jabba.lan", "jabba"),
  ...genDBs("translucent.lan", "translucent"),
  ...genDBs("vision.lan", "vision"),
  ...genDBs("homelander.lan", "homelander"),
];

