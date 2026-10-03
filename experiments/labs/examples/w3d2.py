# 学习目标：同函数评估预算比较
# 使用方式：先预测输出，再运行；最后只改一个输入并解释变化。
# 输出核对：同4次函数评估，Euler约.3164，Heun约.3906。
# math.exp用于精确解e的负一次方
import math
# 定义n步Euler求解函数
def euler(n):
    # 初值1，区间长1，所以步长1/n
    x, h = 1., 1. / n
    # 重复n次完整覆盖积分区间
    for _ in range(n):
        # 斜率为-x，沿斜率前进一步
        x += h * (-x)
    # 返回终点近似值
    return x
# 定义n步Heun求解函数
def heun(n):
    # 与Euler使用相同初值和终止时刻
    x, h = 1., 1. / n
    # 每次进行预测与校正
    for _ in range(n):
        # 先用起点斜率预测终点u
        u = x + h * (-x)
        # 平均起点斜率-x与预测终点斜率-u
        x += h * (-x - u) / 2
    # 返回校正后的终点
    return x
# Euler4步共4次函数评估
print("Euler4:", euler(4), "误差:", abs(euler(4)-math.exp(-1)))
# Heun2步也共4次函数评估，不要仅比较步数
print("Heun2:", heun(2), "误差:", abs(heun(2)-math.exp(-1)))
# 检查本例Heun数值；不是DPM-Solver复现
assert heun(2) == 0.390625
