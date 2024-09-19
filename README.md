# SurrealDB benchmarks

A set of simple benchmarks of various aspects and versions of the SurrealDB database.

## Deployment to test during the livestream

1. SurrealDB 1.5.4 with the default RocksDB storage engine
2. SurrealDB 1.5.4 with the default RocksDB storage engine on RAM disk
3. SurrealDB 1.5.4 with the in-memory storage engine
4. SurrealDB 2.0.1 with the RocksDB storage engine
5. SurrealDB 2.0.1 with the RocksDB storage engine on RAM disk
6. SurrealDB 2.0.1 with the SurrealKV storage engine
7. SurrealDB 2.0.1 with the SurrealKV storage engine on RAM disk
8. SurrealDB 2.0.1 with the in-memory storage engine

Each version will be deployed as a Docker container on this set of machines:
1. Jabba - AMD Ryzen Embedded V1500B, DDR4 RAM, PCI Gen 3 SSD Cache assisted ZFS (NAS)

(in the future)
2. Homelander - Intel i9 12900K, DDR4 RAM, PCI Gen 4 SSD (PC)
3. Translucent - Intel 11th gen Celeron N5105, DDR4 RAM, M.2 SATA3.2 SSD (Beelink U59 Pro)
4. Vision - Intel Ultra 7 155H, DDR5 RAM, PCI Gen 4 SSD (Laptop)

## Docker Compose (Portainer stack)

```yml
version: '3'

services:
  surreal-1-rocksdb:
    image: surrealdb/surrealdb:v1.5.5
    container_name: surreal-1-rocksdb
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
      - ${HOST_VOLUME}:/data
    ports:
      - 14838:8000
  
  surreal-1-rocksdb-ram:
    image: surrealdb/surrealdb:v1.5.5
    container_name: surreal-1-rocksdb-ram
    entrypoint: 
      - /surreal
      - start
      - --auth
      - --user
      - ${DB_USER}
      - --pass
      - ${DB_PASSWORD}
      - file:data/sur-1-rocksdb-ram
    tmpfs:
      - /data
    ports:
      - 14839:8000
  
  surreal-1-memory:
    image: surrealdb/surrealdb:v1.5.5
    container_name: surreal-1-memory
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
    entrypoint: 
      - /surreal
      - start
      - --user
      - ${DB_USER}
      - --pass
      - ${DB_PASSWORD}
      - rocksdb:data/sur-2-rocksdb
    volumes:
      - ${HOST_VOLUME}:/data
    ports:
      - 14841:8000

  surreal-2-rocksdb-ram:
    image: surrealdb/surrealdb:v2.0.1
    container_name: surreal-2-rocksdb-ram
    entrypoint: 
      - /surreal
      - start
      - --user
      - ${DB_USER}
      - --pass
      - ${DB_PASSWORD}
      - rocksdb:data/sur-2-rocksdb-ram
    tmpfs:
      - /data
    ports:
      - 14842:8000

  surreal-2-surrealkv:
    image: surrealdb/surrealdb:v2.0.1
    container_name: surreal-2-surrealkv
    entrypoint: 
      - /surreal
      - start
      - --user
      - ${DB_USER}
      - --pass
      - ${DB_PASSWORD}
      - surrealkv:data/sur-2-surrealkv
    volumes:
      - ${HOST_VOLUME}:/data
    ports:
      - 14843:8000

  surreal-2-surrealkv-ram:
    image: surrealdb/surrealdb:v2.0.1
    container_name: surreal-2-surrealkv-ram
    entrypoint: 
      - /surreal
      - start
      - --user
      - ${DB_USER}
      - --pass
      - ${DB_PASSWORD}
      - surrealkv:data/sur-2-surrealkv-ram
    tmpfs:
      - /data
    ports:
      - 14844:8000
  
  surreal-2-memory:
    image: surrealdb/surrealdb:v2.0.1
    container_name: surreal-2-memory
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