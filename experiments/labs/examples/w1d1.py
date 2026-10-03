# 学习目标：CPU张量与环境检查
# 使用方式：先预测输出，再运行；最后只改一个输入并解释变化。
# 输出核对：一个2行3列的全1张量。CUDA为False也不影响本例。
# sys用于查看Python版本
import sys
# torch是PyTorch库；导入失败先检查Conda环境
import torch
# 输出解释器版本
print("Python:", sys.version.split()[0])
# 输出库版本，便于复现
print("PyTorch:", torch.__version__)
# 检查可用CUDA，不代表此例实际使用GPU
print("CUDA:", torch.cuda.is_available())
# 在默认CPU创建2行3列全1张量
print(torch.ones(2, 3))
# shape是形状，不是张量元素值
assert torch.ones(2, 3).shape == (2, 3)
