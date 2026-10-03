# 学习目标：区分总体方差与标准差
# 使用方式：先预测输出，再运行；最后只改一个输入并解释变化。
# 输出核对：均值2，方差约2.6667，标准差约1.633。
# math是标准数学库，提供平方根等函数
import math
# 三个观测数值是本例输入
values = [0, 2, 4]
# sum除以元素个数是算术平均
mean = sum(values) / len(values)
# 先减均值再平方，平均得到总体方差，分母为N而非N-1
variance = sum((x - mean) ** 2 for x in values) / len(values)
# 查看均值，预期为2
print("均值:", mean)
# 查看平方量纲的方差
print("总体方差:", variance)
# 开平方后得到原量纲的标准差
print("标准差:", math.sqrt(variance))
# 浮点数用容差检查；这不是置信区间估计
assert abs(variance - 8 / 3) < 1e-12
