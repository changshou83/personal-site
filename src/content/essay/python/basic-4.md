---
title: Python 笔记（4）类 & OOP & 数据类
description: 系统讲解了类与魔法方法、数据类、多态、泛型、组合等核心概念，对比了普通类与数据类、数据类与字典的差异
date: 2026-05-14
badge: 笔记
tags: ["Python"]
draft: false
slug: python-basic-4
---

## 类

类可以将数据和相关联的行为封装成一个模板，可以理解为一个自定义的数据结构。支持继承，魔法方法和类方法。

### 创建类及类实例

通过 class 关键词创建类。

```python
class Person:
    # 类属性（所有对象共享）
    species = "Homo sapiens"

    # 类方法: 可以访问类属性
    @classmethod
    def from_birth_year(cls, name, birth_year):
        from datetime import datetime
        current_year = datetime.now().year
        age = current_year - birth_year
        return cls(name, age)

    # 构造方法：初始化属性，创建对象时自动调用；self 代表实例本身
    def __init__(self, name, age):
        self.name = name
        self.age = age
        self.__private_attribute = "This is a private attribute"  # 双下划线 = 私有

    # 实例方法：实例对象可以调用的方法，可访问实例属性
    def greet(self):
        return f"Hello, my name is {self.name} and I am {self.age} years old."
    
    # 静态方法: 不可以访问实例和类属性，仅用于组织代码
    @staticmethod
    def is_adult(age):
        return age >= 18
```

调用类的构造方法，创建类实例：

```python
p = Person("Alice", 30)
print(p.greet()) # 调用实例方法
```

#### 实例方法

实例方法是最常用的方法类型，它操作特定类的实例。实例方法的第一个参数通常是self，表示实例本身，通过实例对象调用。

实例方法可以方便地操作和处理实例对象的属性，定义对象的行为和操作。

#### 类方法

类方法是定义在类中的方法，通过装饰器`@classmethod`来标识。类方法的第一个参数是`cls`，表示类本身，而不是实例对象。类方法可以访问类的属性，并且可以在没有实例的情况下被调用。

类方法的主要用途包括:

1. 访问和修改**类级别**的属性和方法；
2. 实现多个构造函数 **（工厂方法）**；
3. 执行与类相关的操作。

相当于其他语言中类的静态方法。

#### 静态方法

静态方法是定义在类中的一种特殊方法类型，通过装饰器`@staticmethod`来标识。静态方法既不需要传递类对象（cls）也不需要传递实例对象（self）作为第一个参数。

静态方法的主要特点是不需要实例化，可以直接通过类名调用，不依赖实例属性，适用于在类中组织功能性代码。

#### 继承

继承是一种创建新类的方式，子类可以继承父类的属性和方法，并在内部进行扩展或重写。

```python
# 参数中传递父类
class Student(Person):
    # 子类的实例方法
    def __init__(self, name, age, student_id):
        # 调用父类构造函数，初始化父类的属性和方法
        super().__init__(name, age)
        # 新增子类自己的实例属性
        self.student_id = student_id

    # 子类自己的实例方法
    def study(self):
        return f"{self.name} is studying."
```

### 魔法方法

魔法方法就是Python 预留的钩子，用来自定义对象的创建、打印、长度、下标、运算、迭代、属性访问等所有内置行为。它们通常以双下划线（`__`）开头和结尾，例如`__init__`。

例如：

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    # length of the object
    def __len__(self):
        return 2  # length of the point (x, y)

    # string representation of the object
    def __str__(self):
        return f"Point({self.x}, {self.y})"

    # official string representation of the object, used for debugging
    def __repr__(self):
        return f"Point(x={self.x}, y={self.y})"
    
    # equality comparison
    def __eq__(self, other):
        if isinstance(other, Point):
            return self.x == other.x and self.y == other.y
        return NotImplemented

    # operator overloading, example: +
    def __add__(self, other):
        if isinstance(other, Point):
            return Point(self.x + other.x, self.y + other.y)
        return NotImplemented
    def __sub__(self, other):
        if isinstance(other, Point):
            return Point(self.x - other.x, self.y - other.y)
        return NotImplemented
    
    # item access
    def __getitem__(self, key):
        if key == 'x':
            return self.x
        elif key == 'y':
            return self.y
        else:
            raise KeyError(f"Key {key} not found")
    
    # item assignment
    def __setitem__(self, key, value):
        if key == 'x':
            self.x = value
        elif key == 'y':
            self.y = value
        else:
            raise KeyError(f"Key {key} not found")
```

常用的魔法方法：

1. 对象的初始化和构造：如`__new__`（创建实例时初始化属性，最常用构造方法）、`__init__`（创建对象实例，在 `__init__` 之前执行）和`__del__`（对象被垃圾回收、销毁时自动执行）。 
2. 属性访问控制：如`__getattr__`、`__setattr__`和`__delattr__`。 
3. 对象的描述和表示：如`__str__`和`__repr__`。 
4. 运算符重载：如`__add__`、`__sub__`和`__mul__`。 
5. 容器类型的方法：如`__len__`、`__getitem__`和`__setitem__`。 
6. 可调用对象：通过`__call__`方法，可以使得对象的实例像函数一样被调用。 
7. 上下文管理：`__enter__`和`__exit__`方法允许对象支持with语句。 
8. 描述器：`__get__`、`__set__`和`__delete__`方法允许对象控制属性的访问。 
9. 对象的复制：`__copy__`和`__deepcopy__`方法定义了对象被复制时的行为。 
10. 序列化：`__getstate__`和`__setstate__`方法控制对象的序列化和反序列化。

## OOP

OOP（Object Oriented Programming）是一种把数据和操作数据的方法封装成类与对象，用封装、继承、多态、组合实现代码复用、结构清晰、易扩展维护的编程思想。

### 多态

多态允许不同类的对象以统一的方式调用方法。执行逻辑为父类引用指向子类对象，同名方法不同实现，调用时自动执行子类重写的方法。

例子：

```python
# 父类
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def greet(self):
        return f"Hello, my name is {self.name}..."

# 子类1
class Student(Person):
    def __init__(self, name, age, student_id):
        super().__init__(name, age)
        self.student_id = student_id

    # 重写父类方法
    def greet(self):
        return f"Hello, I am student {self.name}"

# 子类2
class Teacher(Person):
    def __init__(self, name, age, subject):
        super().__init__(name, age)
        self.subject = subject

    # 重写父类方法
    def greet(self):
        return f"Hello, I am teacher {self.name}"
   
# 同一个 p.greet()，不同子类执行不同版本
def intro(p: Person):
    print(p.greet())

s = Student("Alice", 20, "S101")
t = Teacher("Bob", 35, "Math")

intro(s) # Hello, I am student Alice
intro(t) # Hello, I am teacher Bob
```

多态的作用：一个接口，多种实现，易扩展。（PS：可以看成if语句，不同的是将逻辑拆分到子类中）

### 泛型

泛型就是类型占位符，类 / 函数支持任意类型且保持类型安全，代码复用。可通过 `TypeVar` + `Generic` 实现。

例如：

```python
from typing import TypeVar, Generic

# 1. 定义类型变量 T（占位符）
T = TypeVar('T')

# 2. 泛型类：容器可以存放任意类型，但固定类型
class Container(Generic[T]):
    def __init__(self, value: T):
        self.value: T = value

    def get(self) -> T:
        return self.value

# 指定 T 为 int
c1 = Container[int](100)
print(c1.get())

# 指定 T 为 str
c2 = Container[str]("hello")
print(c2.get())

# 3. 泛型函数
def identity(value: T) -> T:
    return value    
```

### 组合

组合就是把多个类的对象拼装到另一个类里，用「拥有」代替「继承」，可以降低耦合，由于部件可单独修改、替换，所以不会被父类结构绑定。

例子：

```python
# 小部件类
class Engine:
    def run(self):
        return "发动机启动"

class Wheel:
    def roll(self):
        return "车轮滚动"

# 组合：汽车 包含 发动机、车轮
class Car:
    # 把其他类实例，当作自己的属性
    def __init__(self):
        self.engine = Engine()
        self.wheel = Wheel()

    def drive(self):
        print(self.engine.run())
        print(self.wheel.roll())

# 使用
car = Car()
car.drive()
```

**组合 VS 继承**：

|维度|继承|组合|
|--|--|--|
|关系|is-a 是一个|has-a 拥有一个|
|耦合度|高，父子类绑定强|低，部件相互独立|
|复用方式|直接继承代码|拼装外部对象|
|扩展性|改动父类影响所有子类|可随意替换部件|
|推荐|严格从属关系才用|优先使用|

## 数据类

**数据类（Data Class）** 是 Python 3.7+ 自带的**专门用来存数据的类**，专门解决：**普通类写一堆样板代码（`__init__`、`__repr__`、`__eq__`）太麻烦**的问题。

### 普通类 vs 数据类

1. 普通类
```python
# 普通类：必须手写 __init__、__repr__...
class Person:
    def __init__(self, name: str, age: int, city: str = "北京"):
        self.name = name
        self.age = age
        self.city = city

    def __repr__(self):
        return f"Person(name={self.name!r}, age={self.age!r}, city={self.city!r})"

    def __eq__(self, other):
        if not isinstance(other, Person):
            return False
        return (self.name, self.age, self.city) == (other.name, other.age, other.city)
```

2. 数据类
```python
from dataclasses import dataclass

@dataclass  # 核心装饰器
class Person:
    name: str       # 类型注解 + 字段定义
    age: int
    city: str = "北京"  # 默认值
```

### 数据类核心功能

`@dataclass` **自动生成**这些方法，不用手写：
1. `__init__`：构造函数
2. `__repr__`：打印对象友好显示（不是内存地址）
3. `__eq__`：支持 `==` 比较（按字段值）
4. `__lt__`/`__le__`/`__gt__`/`__ge__`：排序比较（可选）

```python
p1 = Person("张三", 20)
p2 = Person("李四", 25, "上海")
p3 = Person("张三", 20)

print(p1)        # Person(name='张三', age=20, city='北京')
print(p1 == p3)  # True（自动按值比较）
```

### 高级用法

1. 不可变数据类（只读）
```python
@dataclass(frozen=True)  # frozen=True = 不可修改
class Person:
    name: str
    age: int

p = Person("张三", 20)
# p.age = 21  # 报错：FrozenInstanceError
```

2. 支持排序（按字段排序）
```python
@dataclass(order=True)  # order=True = 支持排序
class Student:
    score: int  # 排序依据：写在前面的字段优先
    name: str

s1 = Student(90, "张三")
s2 = Student(80, "李四")
print(s1 > s2)  # True
```

3. 转字典 / 元组
```python
from dataclasses import asdict, astuple

p = Person("张三", 20)
print(asdict(p))  # {'name': '张三', 'age': 20, 'city': '北京'}
print(astuple(p)) # ('张三', 20, '北京')
```

4. 字段默认值（可变类型）
   **注意**：列表/字典等可变类型，不能直接写默认值，要用 `field(default_factory=...)`
```python
from dataclasses import dataclass, field

@dataclass
class ClassRoom:
    name: str
    students: list[str] = field(default_factory=list)  # 正确写法
```

### 数据类 vs 普通字典

| 方式 | 优点 | 缺点 |
|------|------|------|
| 字典 | 简单、无需定义结构 | 无类型提示、容易写错键 |
| **数据类** | **类型安全、自动补全、代码清晰** | 需要提前定义结构 |

**首选数据类**：接口参数、返回值、配置项、数据载体。
