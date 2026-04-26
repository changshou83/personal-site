---
title: Python 笔记（3）函数与生成器
description: Python 函数与生成器详解
date: 2026-04-27
badge: 笔记
tags: ["Python"]
draft: false
slug: python-basic-3
---

## 函数

函数就是把一段可重复使用的代码打包，需要时直接调用，让代码更简洁、更好维护。

一个基础的函数：

```python
def greet_user():
    """文档字符串：说明函数功能"""
    print("Hello!")

greet_user()  # 调用
```

### 函数参数

在括号内声明函数参数，让函数可以在运行时更具动态性，也可以为参数声明默认值。在调用时可以传递函数参数，还有特殊的关键字传参，调用时可以通过指定参数名来传递参数。

```python
def add_numbers(a=1, b=2):
    return a + b

add_numbers()        # 1+2=3
add_numbers(5,3)     # 5+3=8
add_numbers(b=10,a=4) # 关键字传参，顺序随便
```

特殊参数：

1. `*args`：接收任意多个位置参数，变成元组
2. `*kwargs`：接收任意多个关键字参数，变成字典

```python
def make_pizza(*args, **kwargs):
    print("配料：", args)
    print("其他信息：", kwargs)

make_pizza('蘑菇', '芝士', size='大号', crust='薄底')
```

函数参数顺序规则：** 位置参数 → *args → 默认参数 → kwargs **。

### 函数返回值

使用 `return` 语句返回函数返回值，并结束函数执行。可以返回多个值，它们会被自动转换为元组。

```python
# 返回一个值
def add_numbers(a=1, b=2):
    return a + b

add_numbers()

# 返回多个值
def get_name_and_age(name, age):
    return name, age

name, age = get_name_and_age("Alice", 30)
```

### 函数进阶

1. 在 Python 中，函数是一等公民，因此函数可以作为其他函数的参数和返回值，作为前者时，外层函数被称为**高阶函数**，作为后者时，外层函数被称为**闭包**。

```python
# 高阶函数
def apply_function(func, value):
    return func(value)

# lambda 是匿名函数，临时用一次
result = apply_function(lambda x: x**2, 5)
# 5 的平方 → 25

# 闭包
def make_multiplier(multiplier):
    def inner(x):
        return x * multiplier
    return inner

times3 = make_multiplier(3)
print(times3(10))  # 30
```

2. 可以为函数参数和返回值添加类型注解，声明其类型。

```python
def greet(name: str) -> str:
    return f"Hello {name}"
```

3. 函数可以调用自己，形成递归调用

```python
def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n-1)

factorial(5)  # 5*4*3*2*1 = 120
```

4. 装饰器函数，可以在不修改原函数的情况下，给函数添加功能，属于元编程的功能。

```python
# 参数为被装饰的函数
def uppercase_decorator(func):
    def wrapper():
        res = func()
        return res.upper()
    return wrapper

# 使用 @ 调用装饰器
@uppercase_decorator
def greet():
    return "hello"

print(greet())  # HELLO
```

5. 生成器函数可以一边循环一边生成，不占大量内存，后面会详细讲解。

## 生成器

生成器是一边循环一边生成值的 “惰性迭代器”，用 yield 产生数据，不占大量内存，专门处理大数据 / 无限序列。

创建生成器函数：普通函数用 return 返回值，**生成器函数用 yield 产生值**。还可以使用生成器表达式创建生成器函数。

创建生成器对象：调用生成器函数生成生成器对象，此时并不会执行函数，只有使用 `next(g)` 时才可以调用生成器。

```python
def gen():
    yield 1 # 返回 1，并暂停函数执行，再次调用时，从暂停处执行
    yield 2
    yield 3

g = gen()  # 创建生成器对象（不会马上运行）

# 惰性计算，每次 next() 才生成一个值
print(next(g))  # 1
print(next(g))  # 2
print(next(g))  # 3

# 生成器函数，和列表推导式很像，但用 ()
squares = (x**2 for x in range(5))

print(next(squares))  # 0
print(next(squares))  # 1
print(next(squares))  # 4
print(next(squares))  # 9
print(next(squares))  # 16
```

如果想向生成器发送数据，则使用 `g.send(value)` 函数，生成器函数内可以通过 `yield` 接收值。不想继续迭代时，可以使用 `g.close()` 函数提前关闭迭代器。

```python
def gen():
    while True:
        value = yield  # 接收外部 send 进来的值
        print(f"Received: {value}")

g = gen()
next(g)      # 启动生成器
g.send("Hello")
g.send("World")
g.close()
```
