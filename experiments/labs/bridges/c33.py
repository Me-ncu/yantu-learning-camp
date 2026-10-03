# 类封装一个整数状态；每个实例独立保存value。
class Counter:
    def __init__(self, start=0):
        self.value = start  # 初始化本实例，而非共享类级列表。

    def add(self, amount):
        self.value += amount  # 修改当前对象状态。
        return self.value  # 返回结果给调用者。

if __name__ == "__main__":
    first, second = Counter(2), Counter(10)  # 两个不同对象。
    assert first.add(3) == 5  # 用断言代替只看打印。
    assert second.value == 10  # 修改first不影响second。
    print(first.value, second.value)  # 预期5 10。
