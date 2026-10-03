# 学习目标：自己写函数并处理空输入
# 使用方式：先预测输出，再运行；最后只改一个输入并解释变化。
# 输出核对：平方为1、4、9，均值4.0；空列表错误被明确捕获。
# def定义函数，x是调用时传入的参数
def square(x):
    # return把平方结果交还给调用者
    return x * x

# values应是一个数值列表
def mean(values):
    # 空列表在条件中视为False，not把它取反
    if not values:
        # 主动报错，避免后面除以零
        raise ValueError("列表不能为空")
    # sum求和、len计数，两者相除得到均值
    return sum(values) / len(values)

# for依次把列表元素赋给value
for value in [1, 2, 3]:
    # 调用square并打印当前值及平方
    print(value, square(value))
# 传入三个数，打印函数返回的均值
print("均值:", mean([2, 4, 6]))
# try中的代码可能触发可预料的错误
try:
    # 故意传空列表，测试边界情况
    mean([])
# 只捕获ValueError，其他异常仍应暴露
except ValueError as error:
    # 输出错误原因，程序继续运行
    print("预期的错误:", error)
# 最后核对正常输入的结果
assert mean([2, 4, 6]) == 4
