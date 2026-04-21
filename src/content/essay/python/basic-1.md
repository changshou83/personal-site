---
title: Python 笔记（1）基础语法，控制流，变量和基本数据类型，错误处理
description: 数据系统没有银弹，一切都是权衡，围绕四大维度展开对比与取舍
date: 2026-04-21
badge: 笔记
tags: [ "Python"]
draft: false
slug: python-basic-1
---

## 基础语法

1. 严格区分大小写。
2. 一行一条语句，默认不需要 `;`。
3. 不用大括号 `{}`，用缩进表示代码块，通常用 4 个空格 缩进。冒号 `:` 表示一段代码块开始。
4. 注释：单行注释用 `#` 开头，多行注释用三个单引号 `'''` 或三个双引号 `"""` 包裹。
5. 输入输出用 `print` 和 `input` 方法。
6. 一行太长可以用 `\` 换行。括号内则可以直接换行，不用 `\`。

## 控制流

### 条件分支结构

三种语句或表达式：

1. if 语句：`if - elif - else`。
2. 固定值匹配：`match - case`（3.10+支持），`case 1|2：` 匹配 1 或 2，`case _:` 相当于 default。
3. 三元表达式：`variable = true_result if condition else false_result`。

复杂条件：

1. 逻辑判断：`and`/`or`/`not`
2. 成员判断：`in`/`not in`
3. 相等比较：`==`/`!=`

### 循环结构

#### 两种循环语句

1. for 循环：`for variable in iterator:`。
2. while 循环：`while condition:`。

for 循环的常见用法：

1. 遍历序列，例如列表，字符串：`for item in list:`
2. 带索引遍历：`for idx, item in enumerate(list):`
3. 遍历数字范围：`for i in range(1,5,2):`，`range` 方法参数：`start`，`end`，`step`，只传一个就是 `end`。不包含 `end` 本身。

比较特殊的是，Python 可以在 for 循环中添加 `else` 代码块，它会在循环正常结束时执行。

#### 循环控制语句

1. `break`：立即终止整个循环。
2. `continue`：跳过本次，继续下一次。

## 变量及基本数据类型

定义变量：`name = value`，没有关键字，类型在 Python 3.5+ 之后出了类型提示之后可以加。Python中没有语言层面上的常量，通常用大写字母的变量名表示常量。

变量命名规范：

1. 变量名、函数名用小写 + 下划线，例如：`user_name`，`get_info`。
2. 类名用大驼峰，例如：`User`。
3. 常量用全大写 + 下划线，例如：`MAX_COUNT`。

简单的数据类型：

1. 字符串(`str`)：用单引号 / 双引号 / 三引号（多行）包裹的文本内容。
2. 整数(`int`)：没有小数点的数字。
3. 浮点数(`float`)：带小数点的数字。浮点数计算可能有精度误差（比如 0.1 + 0.2 != 0.3）。
4. 布尔值(`bool`)：只有两个值，`True` 和 `False`。
5. 空值(`None`)：表示 **“什么都没有”** 的特殊值。

字符串的常见操作：

1. `+` 进行字符串拼接
2. `*` 进行字符串重复
3. `[]` 和索引取值
4. 切片取子串
5. 字符串模板 `f"My name is {name}."`

常用方法有 `lower`，`upper`，`replace`，`title`，`strip`(去除双边空格)。

基础数据类型全部是不可变类型，修改值会生成新对象（Python中一切皆对象）。

## 错误处理

Python的错误处理语句为 `try - except - finally`，抛出错误时使用 `raise` 语句。

常见的错误类型有：

1. SyntaxError（语法错误）
2. IndexError（访问不存在的索引）
3. KeyError（访问字典中不存在的键）
4. ValueError（函数参数类型错误）
5. TypeError（值类型错误）

比较特殊的是，Python可以在错误处理语句中添加 `else` 代码块，它将会在没有错误发生时执行。
