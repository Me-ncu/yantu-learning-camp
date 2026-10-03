# 学习目标：按场景重采样配对差值
# 使用方式：先预测输出，再运行；最后只改一个输入并解释变化。
# 输出核对：配对均值.5；小样本区间仅教学，不能当真实模型结论。
# random提供可重复抽样
import random
# statistics用于求均值
import statistics
# 每个差值来自同一场景下两种方法，只有四个合成场景
differences = [1., -1., 2., 0.]  # 合成例子
# 使用独立随机数生成器，固定种子
rng = random.Random(7)
# choices有放回抽四项，重复1000次均值并排序
means = sorted(statistics.mean(rng.choices(differences, k=4)) for _ in range(1000))
# 原始配对差的平均值
print("配对均值:", statistics.mean(differences))
# 取教学百分位端点，不是95%图像误差范围
print("教学百分位区间:", means[25], means[974])
# 核对平均值；小样本区间不支持真实模型结论
assert statistics.mean(differences) == .5
