# SurrealDB benchmarks

A set of simple benchmarks of various aspects and versions of the SurrealDB database.

> [!WARNING]  
> Before running each benchmark, make sure to stop SurrealDB, remove all data and start it again. This ensures that the tests won't be affected by any previous test data and suffer due to performance degradation due to the storage layer. Please see the results of the `tombstones` benchmark for more information.

## SurrealDB 1.5.4 vs 2.0.1 tests

The test results are available in a [Google Sheets file here](https://docs.google.com/spreadsheets/d/1D9RltO6KF2LIYc1Y2-e0zSCsg82PWne7OdPIrMaC-Wk/edit?usp=sharing). This google sheet will be updated with the results of various new tests as they are designed and performed.

## Running the benchmarks

This requires [Bun](https://bun.sh/) to be installed.

1. Configure the databases / servers to use in the `database.ts` file
2. Configure the benchmarks to run in the `benchmarks.ts` file
3. Run `bun install` to install the required dependencies
4. Run `bun start` to run the benchmarks
5. Collect the results in the `results` folder. Each benchmark will create 2 CSV files:
    - One with the raw data - one row per iteration, each column is a query result
    - One with the summary - besides the header, the first row is an average of all iterations per query, while the second row is simply the number of iterations with successful queries

## Testing deployments

1. SurrealDB 1.5.4 with the default RocksDB storage engine
3. SurrealDB 1.5.4 with the in-memory storage engine
4. SurrealDB 2.0.1 with the RocksDB storage engine
6. SurrealDB 2.0.1 with the SurrealKV storage engine
8. SurrealDB 2.0.1 with the in-memory storage engine

Each version will be deployed as a Docker container on the following set of machines:
1. Jabba - AMD Ryzen Embedded V1500B, DDR4 RAM, 8x HDD ZFS with read/write cache using PCI Gen 3 SSDs (QNAP NAS)
2. Homelander - Intel i9 12900K, DDR4 RAM, PCI Gen 4 SSD (Windows 11 PC - WSL2)
3. Translucent - Intel 11th gen Celeron N5105, DDR4 RAM, M.2 SATA3.2 SSD (Ubuntu Server Beelink U59 Pro MiniPC)
4. Vision - Intel Ultra 7 155H, DDR5 RAM, PCI Gen 4 SSD (Windows 11 Laptop - WSL2)

## Docker Compose (Portainer stack)

```yml
services:
  surreal-1-rocksdb:
    image: surrealdb/surrealdb:v1.5.5
    container_name: surreal-1-rocksdb
    user: "1000:1000"
    entrypoint:
      - /surreal
      - start
      - --auth
      - --user
      - ${DB_USER}
      - --pass
      - ${DB_PASSWORD}
      - file:data/sur-1-rocksdb
    volumes:
      - ${HOST_VOLUME}:/data:rw
    ports:
      - 14838:8000
  
  surreal-1-memory:
    image: surrealdb/surrealdb:v1.5.5
    container_name: surreal-1-memory
    user: "1000:1000"
    entrypoint:
      - /surreal
      - start
      - --auth
      - --user
      - ${DB_USER}
      - --pass
      - ${DB_PASSWORD}
      - memory
    ports:
      - 14840:8000
  
  surreal-2-rocksdb:
    image: surrealdb/surrealdb:v2.0.1
    container_name: surreal-2-rocksdb
    user: "1000:1000"
    entrypoint:
      - /surreal
      - start
      - --user
      - ${DB_USER}
      - --pass
      - ${DB_PASSWORD}
      - rocksdb:data/sur-2-rocksdb
    volumes:
      - ${HOST_VOLUME}:/data:rw
    ports:
      - 14841:8000
  
  surreal-2-surrealkv:
    image: surrealdb/surrealdb:v2.0.1
    container_name: surreal-2-surrealkv
    user: "1000:1000"
    entrypoint:
      - /surreal
      - start
      - --user
      - ${DB_USER}
      - --pass
      - ${DB_PASSWORD}
      - surrealkv:data/sur-2-surrealkv
    volumes:
      - ${HOST_VOLUME}:/data:rw
    ports:
      - 14843:8000
  
  surreal-2-memory:
    image: surrealdb/surrealdb:v2.0.1
    container_name: surreal-2-memory
    user: "1000:1000"
    entrypoint:
      - /surreal
      - start
      - --user
      - ${DB_USER}
      - --pass
      - ${DB_PASSWORD}
      - memory
    ports:
      - 14845:8000
```