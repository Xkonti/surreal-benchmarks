First manual benchmark:

```surql
RETURN "Ready";
CREATE |test1:10000| SET numberA = rand::int(-1000, 1000), numberB = rand::int(-1000, 1000), numberC = rand::int(-1000, 1000);
SELECT * FROM test1;
SELECT * FROM test1 WHERE numberA > numberB AND numberB > numberC;
SELECT numberA AS result FROM test1 WHERE numberA > numberB AND numberB > numberC;
DELETE test1;
```

