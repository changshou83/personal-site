---
title: Python 笔记（2）容器与推导式
description: 数据系统没有银弹，一切都是权衡，围绕四大维度展开对比与取舍
date: 2026-04-26
badge: 笔记
tags: ["Python"]
draft: false
slug: python-basic-2
---

## 容器

### List

列表就是有序、可修改、可重复的容器，用来存一组数据（数字、字符串、对象都可以）。

列表的操作：

1. 创建列表：使用 `[]` 创建列表，例如：`fruits = ["apple", "banana", "cherry"]`。
2. 可以通过 `len(lsit)` 方法获取列表长度。
3. 访问元素：可以通过索引访问列表元素，负值索引的话是从末尾往前数。
4. 查询元素：`list.index(value)` 方法获取值在列表中的位置，不存在的话会报错。建议遍历列表进行查找。
5. 添加元素：`list.append(value)` 方法追加值到列表末尾，`list.insert(index, value)` 方法将值插入到指定位置。
6. 删除元素：`lsit.remove(value)` 方法从列表中删除指定值，`list.pop(index)` 方法删除列表中指定位置的值。
7. 排序：`list.sort()` 方法将当前列表按正序排列，想要倒序的话传 `reverse=True` 参数即可，想要按照自定义规则排序传 `key` 参数即可，值为 `lambda` 函数。前面的方法都会修改原列表，不想修改原列表就用 `sorted(list)` 方法，会返回一个排序后的新列表。
8. 反转列表：`list.reverse()` 直接反转原列表，或者用切片也可以 `lsit[::-1]`。
9. 遍历列表：使用 `for...in` 遍历列表。

列表切片：可以用来截取子列表，语法是 `list[start:end:step]`。

1. 不写开始 = 从头开始。
2. 不写结束 = 取到最后。
3. 步长 = 每隔几个取一个。
4. 不包含结束索引。

### Dict

字典是键值对存储、按 key 取值、可增删改的最常用数据结构，适合存储结构化信息。

字典的操作：

1. 创建字典：使用 `{}` 创建字典，例如：`person = {"name": "Alice", "age": 30, "city": "New York"}`。
2. 访问值：使用键访问值 `dict[key]`，找不到会报错，建议使用 `dict.get(key)` 方法，找不到不会报错，而是返回 `None`。
3. 修改值：可以直接通过键进行赋值，例如：`dict[key] = new_value`。
4. 添加新键值对：`dict[new_key] = new_value`。
5. 删除键值对：`del dict[key]`。
6. 遍历字典：使用 `for...in` 遍历字典，使用 `dict.items()` 遍历键值对，`dict.keys()` 遍历键，`dict.values()` 遍历值。

### Set

集合就是一组值，特点是无序、元素唯一不可重复、可变。

集合的操作：

1. 创建集合：用 `set()` 方法创建集合，不传值是空集合，传可遍历对象，则将其转换为集合。也可以直接使用 `{}` 创建，不过一定要有值，不然就是空字典了。
2. 判断元素是否存在：`value in set` 可以判断集合中是否存在该元素。 
3. 添加元素：`set.add(value)` 方法可以添加单个值到集合， `set.update(value,...)` 方法可以添加多个。
4. 删除元素：`set.remove(value)` 方法删除元素，不存在会报错。`set.discard(value)` 也是删除元素，但是不存在不会不报错。
5. 清空集合：`set.clear()` 方法可以清空集合。
6. 遍历集合：可以使用 `for...in` 遍历集合，但是因为集合无序，所以遍历顺序不固定。

集合运算：

1. 并集：`seta.union(setb)` 或者 `seta | setb`；
2. 交集：`seta.intersection(setb)` 或者 `seta & setb`；
3. 差集：`seta.difference(setb)` 或者 `seta - setb`；
4. 子集：`seta.issubset(setb)`；
5. 父集：`seta.issuperset(setb)`；
6. 无交集：`seta.isdisjoint(setb)`；
7. 对称差集：`seta.symmetric_difference(setb)` 或者 `seta ^ setb`。

集合的常见用法：

1. 快速去重（元素唯一）；
2. 找共同元素（并集）；
3. 快速判断存在。

### Tuple

元组类似列表，但是具有的不可变的特点，用于存储固定不变的一组数据。

元组的操作：

1. 创建元组：使用 `()` 创建元组，例如：`coordinates = (10.0, 20.0)`。
2. 访问元素：跟列表一样，可以使用正负索引取值。
3. 遍历元组：使用 `for...in` 遍历元组。
4. 元祖拼接：可以使用 `+` 将两个元组拼接成一个新元组。

## 推导式

Python 推导式（Comprehension）就是一行代码快速生成列表 / 字典 / 集合 / 生成器的简洁写法，比循环更短、更 Pythonic。

```python
# 列表推导式:[表达式 for 变量 in 可迭代对象 if 条件]
nums = [x for x in range(10)]            # [0,1,2,...,9]
evens = [x for x in range(10) if x%2==0] # 偶数，可以替代filter函数
squares = [x**2 for x in range(5)]       # 平方，可以替代map函数

# 字典推导式:{键:值 for 变量 in 可迭代对象 if 条件}
d = {x: x**2 for x in range(5)}          # {0:0,1:1,2:4,3:9,4:16}

# 集合推导式:{表达式 for 变量 in 可迭代对象 if 条件}
s = {x % 3 for x in range(10)}           # {0,1,2}

# 生成器推导式:用 () 包裹，不一次性生成全部，适合大数据
g = (x for x in range(1000000))
```
