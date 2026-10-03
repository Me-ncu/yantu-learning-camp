# 学习目标：同一失败数的两个分母
# 使用方式：先预测输出，再运行；最后只改一个输入并解释变化。
# 输出核对：分别0.6、0.06、0.1。更改分母回答的是不同问题。
# total是所有测试图像数量
total = 100
# accelerated是实际采用低成本方案的图像数量
accelerated = 60
# failed只统计加速图中质量未达标者
failed = 6
# 覆盖率分母是所有图像
print("覆盖率:", accelerated / total)
# 全体错误比例分母仍为所有图像
print("全体错误比例:", failed / total)
# 选择后失败率分母是加速图；分母0时应记不适用
print("选择后失败比例:", failed / accelerated)
# 此例6除以60等于0.1，即10%
assert failed / accelerated == 0.1
