# 学习目标：前向加噪与反解
# 使用方式：先预测输出，再运行；最后只改一个输入并解释变化。
# 输出核对：带噪值.46、反解.8；此处使用已知噪声，真实推理需网络预测。
# math提供平方根
import math
# x0是干净标量，epsilon是已知噪声，alpha_bar是累计信号保留量
x0, epsilon, alpha_bar = 0.8, -0.3, 0.64
# a和s分别是信号与噪声系数，不能把方差直接当系数
a, s = math.sqrt(alpha_bar), math.sqrt(1 - alpha_bar)
# 实现前向加噪公式
xt = a * x0 + s * epsilon
# 已知噪声时可反解；a为0时不能这样除
recovered = (xt - s * epsilon) / a
# 对照手算；真实推理只能使用预测噪声
print("带噪:", xt, "反解:", recovered)
# 校验带噪结果；这里不是去噪模型测试
assert abs(xt - 0.46) < 1e-12
