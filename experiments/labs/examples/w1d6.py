# 学习目标：检查卷积输出形状
# 使用方式：先预测输出，再运行；最后只改一个输入并解释变化。
# 输出核对：输出[2,8,16,16]。输出通道8由层配置决定。
# 导入卷积库
import torch
# B=2、C=3、H=W=32的输入
x = torch.zeros(2, 3, 32, 32)
# 3输入通道、8输出通道、3×3核、步幅2、补边1
layer = torch.nn.Conv2d(3, 8, kernel_size=3, stride=2, padding=1)
# 调用层进行前向计算
y = layer(x)
# 确认输入轴含义
print("输入:", x.shape)
# 按公式得到16×16的输出空间
print("输出:", y.shape)
# 元组比较检查完整输出形状
assert tuple(y.shape) == (2, 8, 16, 16)
