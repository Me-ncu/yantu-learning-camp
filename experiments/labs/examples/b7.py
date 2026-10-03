# 学习目标：有限差分检查手算梯度
# 使用方式：先预测输出，再运行；最后只改一个输入并解释变化。
# 输出核对：两者都约-18。有限差分只作小例子检查，不替代大型网络反向传播。
# 同时给输入、权重、偏置和目标赋值
x, w, b, target = 3.0, 2.0, 1.0, 10.0
# 函数仅改变权重，其他量固定
def loss(weight):
    # 平方误差是要最小化的损失
    return (weight * x + b - target) ** 2
# h是很小的扰动；太小会增加浮点抵消误差
h = 1e-5
# 中心差分用左右两点损失差除以距离2h
numeric = (loss(w + h) - loss(w - h)) / (2 * h)
# 按链式法则计算精确导数
analytic = 2 * (w * x + b - target) * x
# 输出数值近似
print("有限差分:", numeric)
# 输出手算结果，比较方向和大小
print("手算梯度:", analytic)
# 容差内一致只验证本例，不替代一般证明
assert abs(numeric - analytic) < 1e-5
