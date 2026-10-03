# 学习目标：主动制造并修复一个形状错误
# 使用方式：先预测输出，再运行；最后只改一个输入并解释变化。
# 输出核对：先显示维度错误，再显示正确形状。解释为何后者符合逐通道偏置。
# 导入PyTorch
import torch
# 建立BCHW输入
x = torch.zeros(2, 3, 4, 5)
# 在可控范围主动制造错误
try:
    # 右对齐比较维度，5与3不兼容，无法广播
    x + torch.ones(2, 3)
# 捕获预期的张量运行时错误
except RuntimeError as error:
    # 只打印首行方便定位，实际排错可看完整错误
    print("预期错误:", str(error).splitlines()[0])
# 1×3×1×1可在批量和空间维广播
fixed = x + torch.ones(1, 3, 1, 1)
# 查看修复后的形状
print("修复后:", fixed.shape)
# 保证没有错误改变输入形状
assert fixed.shape == x.shape
