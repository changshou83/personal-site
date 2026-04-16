---
title: SQL 基础
description: 讲解基础SQL语法
date: 2026-04-6
badge: 笔记
tags: [ "SQL", "读书笔记"]
draft: false
---

:::tip
本文章为《SQL基础教程》的读书笔记
:::

## 定义数据：DDL

### 数据库操作

`CREATE/DROP/ALTER DATEBASE`

### 表操作
```sql
-- 建表
CREATE TABLE <name> (
    -- <column_name> <data_type>,
    id VARCHAR(32) NOT NULL,
    name VARCHAT(100) NOT NULL,
    age INTERGER,
    -- 定义主键
    PRIMARY KEY (id)
);

-- 删表
DROP TABLE <name>;

-- 改表，operate eg: ADD COLUMN card_no CHAR(18), DROP COLUMN card_no
ALTER TABLE <name> <operate> <params>;
```

## 查询数据：DQL

语句执行顺序：`FROM > WHERE > GROUP BY > HAVING/聚合函数 > SELECT > 窗口函数 > DISTINCT > ORDER BY > LIMIT`。

### SELECT 语句：查询数据

```sql
-- 全部查询
SELET *
FROM <table_name>;

-- 查询指定列
SELECT <column_name>,...
FROM <table_name>;

-- 列别名
SELECT <column_name> AS <alias>,...
FROM <table_name>;

-- 列去重
SELECT DISTINCT <column_name>,...
FROM <table_name>;

/* 分组前根据查询条件进行过滤,例如:
 (1) name=18
 (2) a.id=b.index_id
 (3) LIKE '% DDIA' OR 'DDIA%' */
SELECT <column_name>,...
FROM <table_name>
WHERE <conditions>;

-- 聚合函数：`COUNT,SUM,AVG,MAX,MIN`，`SELECT`和`HAVING`可以使用。例如：统计不重复的用户数
SELECT <function_name>(DISTINCT <column_name>) AS <alias>
FROM <table_name>;

-- 分组：按某一列（或多列）分类汇总，配合聚合函数使用才有意义
SELECT <column_name>,...
FROM <table_name>
GROUP BY <column_name>,...;

-- 分组后根据查询条件进行过滤
SELECT <column_name>,...
FROM <table_name>
GROUP BY <column_name>,...
HAVING <conditions>;

-- 排序
SELECT <column_name>,...
FROM <table_name>
ORDER BY <column_name> ASC/DESC,...;

/* 子查询:嵌套在另一条 SQL 里的 SELECT 查询 */
-- WHERE 语句中的子查询（常用）
SELECT * FROM student
WHERE class_id = (SELECT id FROM class WHERE class_name = '三年二班');

-- FROM 语句中的子查询
SELECT *
FROM (SELECT name, age FROM student WHERE age > 18) AS t
WHERE t.age > 20;

-- SELECT 语句中的子查询（标量子查询，返回单一值的子查询）
SELECT
    name,
    (SELECT class_name FROM class c WHERE c.id = s.class_id) AS className
FROM student s;

-- 关联子查询:子查询里用到了外层表的字段，内外有关联，不是独立运行。
-- 大数据量慎用，性能不好，需要换成联表查询
-- 判断用户有没有订单
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id)
-- 查询大于班级平均分的学生
WHERE score > (SELECT AVG(score) FROM score s2 WHERE s2.class_id = s1.class_id)
```

### 集合运算

- 并集：`UNION`(合并，并去重)；`UNION ALL`(直接合并，不去重)
- 交集：`INTERSECT`。一般用 `JOIN / EXISTS` 替代。
- 差集：`EXCEPT`。

```sql
SELECT name FROM student
UNION ALL
SELECT name FROM teacher;
```

### 联表查询

- 内连接：`INNER JOIN`,保留两边都匹配的数据。
- 左连接：`LEFT JOIN`,左表全部保留，右表匹配不到填 `NULL`。
- 右连接：`RIGHT JOIN`,右表全部保留，左表匹配不到 `NULL`。实际很少用，一般改成 `LEFT JOIN`。
- 外连接：`OUTER JOIN`,两边都保留，匹配不到 `NULL`。复杂统计才会用。
- 笛卡尔积：`CROSS JOIN`,不加 `ON`，直接全排列。几乎不用.

```sql
-- 查询有订单的用户数据及订单数据
SELECT *
FROM user u
INNER JOIN order o
ON u.user_id = o.user_id;

-- 查询所有用户及他的订单信息
SELECT *
FROM user u
LEFT JOIN order o
ON u.user_id = o.user_id;
```

### 运算符

```sql
-- 算数：+,-,*,/,%
SELECT name, price, price * 0.8 AS 折后价
FROM products;

-- 比较：=,<>,>=,<=,<,>
SELECT *
FROM users
WHERE age > 18;

/* 逻辑
(1)AND,OR,NOT
(2)IN,LIKE,BETWEEN...AND...,CASE...WHEN...THEN...ELSE...END
(3)IS NULL,IS NOT NULL
(4)EXISTS,NOT EXISTS
(5)CASE <column_name>
       WHEN <condition> THEN <result>
       ELSE <default_result>
   END
*/
-- 年龄在18-30之间
WHERE age BETWEEN 18 AND 30
-- 城市是北京或上海
WHERE city IN ('北京','上海')
-- 姓名以"张"开头
WHERE name LIKE '张%'
-- 邮箱不为空
WHERE email IS NOT NULL
```

### 函数

1. 字符串函数：`LENGTH`,`UPPER/LOWER`,`TRIM`,`SUBSTRING`,`REPLACE`,`||/CONCAT`(字符串拼接)
2. 数值函数：`ABS/ROUND/CEIL/FLOOR/MOD`
3. 日期函数：`NOW/CURRENT_DATE`,`YEAR/MONTH/DAY`,`EXTRACT`
4. 转换函数：`CAST`(转换数据类型),`COALESCE`(取第一个非空值)
5. 聚合函数：`COUNT/SUM/AVG/MAX/MIN`
6. 其他：`IF(expr, v1, v2)`

```sql
SELECT UPPER(name), SUBSTRING(phone,1,3), REPLACE(content, '敏感词', '***') FROM user;
SELECT ROUND(price*0.8,2) FROM products;
-- 近30天订单
SELECT * FROM orders
WHERE create_time > DATE_SUB(CURDATE(), INTERVAL 30 DAY);
SELECT IF(age >= 18, '成年', '未成年') AS adult FROM user;
-- 把字符串金额转成数字再求和
SELECT SUM(CAST(price_str AS DECIMAL(10,2))) FROM orders;
```

### 窗口函数（数据分析用得多）
不对数据进行分组聚合、不减少行数。在最终结果集之上做排序、排名、累计计算。只能出现在`SELECT`里。

#### 语法

```sql
<function_name>(<column_name>) OVER (
    -- 分组可选
    PARTITION BY <group_column_name>,...
    ORDER BY <order_column_name> ASC/DESC,...
);
```

#### 分类

1. 专用窗口函数：
`RANK`（排名，并列会跳号 1,1,3,4）
`DENSE_RANK`（密集排名，并列不跳号 1,1,2,3）
`ROW_NUMBER`（行号，连续不重复 1,2,3,4）
2. 聚合窗口函数：同聚合函数
3. 偏移函数：`LAG(字段)`：取上一行的值；`LEAD(字段)`：取下一行的值。用于同比/环比

```sql
-- 分组内排名
SELECT
    name,
    class_id,
    score,
    ROW_NUMBER() OVER(PARTITION BY class_id ORDER BY score DESC) AS rn,  -- 连  续不重复
    RANK()       OVER(PARTITION BY class_id ORDER BY score DESC) AS rk,  -- 并  列跳号
    DENSE_RANK() OVER(PARTITION BY class_id ORDER BY score DESC) AS drk   -- 并  列不跳号
FROM student;

-- 分组内聚合
SELECT
    name,
    class_id,
    score,
    AVG(score) OVER(PARTITION BY class_id) AS class_avg,
    SUM(score) OVER(PARTITION BY class_id) AS class_sum,
    MAX(score) OVER(PARTITION BY class_id) AS class_max
FROM student;

-- 取上一条 / 下一条记录（环比、对比昨日）
SELECT
    user_id,
    login_dt,
    LAG(login_dt)  OVER(PARTITION BY user_id ORDER BY login_dt) AS last_login,
    LEAD(login_dt) OVER(PARTITION BY user_id ORDER BY login_dt) AS next_login
FROM user_login;
```

#### 行范围限定：指定窗口从哪一行到哪一行。

- `2 PRECEDING`：当前行前面 2 行
- `CURRENT ROW`：当前行
- `1 FOLLOWING`：当前行后面 1 行
- `UNBOUNDED PRECEDING`：从第一行开始
- `UNBOUNDED FOLLOWING`：到最后一行

```sql
-- 移动平均 / 滑动窗口（近 3 天平均）
SELECT
    dt,
    sales,
    AVG(sales) OVER(ORDER BY dt ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS moving_avg
FROM daily_sales;
```

#### 添加合计/小计行

- `ROLLUP`：在`GROUP BY`增加`WITH ROLLUP`，为单维度添加小计和总结行。
- `GROUPING`：用于给总计行改名。

```sql
-- 结果会多一行合计
SELECT IF(GROUPING(dept)=1, '合计', dept) AS dept, SUM(salary)
FROM employee
GROUP BY dept WITH ROLLUP;
```

#### 经典应用场景

- 排名、TopN → `ROW_NUMBER / RANK / DENSE_RANK`
- 组内聚合 → `SUM/AVG/MAX/MIN OVER(PARTITION BY)`
- 累计、滑动 → `SUM/AVG OVER(ORDER BY)`
- 前后行对比 → `LAG / LEAD`
- 首尾记录 → `FIRST_VALUE / LAST_VALUE`

### 视图

一张虚拟表，本质是一条保存起来的 `SELECT` 语句。

```sql
-- 创建视图
CREATE VIEW <view_name> AS
SELECT <column_name>,...
FROM <table_name>
WHERE <conditions>;

-- 使用视图
SELECT * FROM <view_name>;

-- 修改视图
CREATE OR REPLACE VIEW <view_name> AS ...;

-- 删除视图
DROP VIEW <view_name>;
```

## 更新数据：DML

```sql
-- 数据插入，VALUES或者SELECT语句都可以
INSERT INTO <table_name> (column_name,...)
VALUES (value,...);

-- 数据删除：必须写WHERE
DELETE FROM <table_name>
WHERE <condition>;

-- 数据更新：必须写WHERE
UPDATE <table_name>
SET <column_name> = <value,...
WHERE <condition>;
```

## 事务
事务中的语句要么一起成功，要么一起失败，保证数据安全一致。

ACID: 
1. Atomicity 原子性：事务是最小单位，不可拆分
2. Consistency 一致性：执行前后，数据的完整性约束不变
3. Isolation 隔离性：多个事务同时运行时，互不干扰
4. Durability 持久性：一旦 COMMIT 提交，数据就永久保存
```sql
-- 开启事务
BEGIN TRANSACTION;

-- SQL 语句
UPDATE account SET money = money - 100 WHERE id = 1;
UPDATE account SET money = money + 100 WHERE id = 2;

-- 没问题提交事务
COMMIT;

-- 有问题回滚事务
-- ROLLBACK;
```
