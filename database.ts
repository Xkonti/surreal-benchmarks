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

export const jabbaSet = genDBs("jabba.lan", "jabba");
export const translucentSet = genDBs("translucent.lan", "translucent");
export const visionSet = genDBs("vision.lan", "vision");
export const homelanderSet = genDBs("homelander.lan", "homelander");